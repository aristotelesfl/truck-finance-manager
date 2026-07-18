import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { DEFAULT_TAGS } from '../utils/tags'
import type { ExpenseType, Tag, Transaction, TransactionKind, Vehicle } from '../types'

function toMillis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : Date.now()
}

function mapVehicle(snap: QueryDocumentSnapshot<DocumentData>): Vehicle {
  const data = snap.data()
  return {
    id: snap.id,
    plate: data.plate,
    nickname: data.nickname || undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

function mapTag(snap: QueryDocumentSnapshot<DocumentData>): Tag {
  const data = snap.data()
  return {
    id: snap.id,
    name: data.name,
    expenseType: data.expenseType,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

function mapTransaction(snap: QueryDocumentSnapshot<DocumentData>): Transaction {
  const data = snap.data()
  return {
    id: snap.id,
    kind: data.kind,
    expenseType: data.expenseType || undefined,
    tagId: data.tagId || undefined,
    tagName: data.tagName || undefined,
    valueCents: data.valueCents,
    date: data.date,
    description: data.description || '',
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

// ---- User bootstrap ----

export async function ensureUserBootstrap(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  if (userSnap.exists()) return

  const batch = writeBatch(db)
  batch.set(userRef, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

  const tagsCol = collection(db, 'users', uid, 'tags')
  for (const [expenseType, names] of Object.entries(DEFAULT_TAGS) as [ExpenseType, string[]][]) {
    for (const name of names) {
      const tagRef = doc(tagsCol)
      batch.set(tagRef, {
        name,
        expenseType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }

  await batch.commit()
}

// ---- Vehicles ----

function vehiclesCol(uid: string) {
  return collection(db, 'users', uid, 'vehicles')
}

export function subscribeVehicles(uid: string, callback: (vehicles: Vehicle[]) => void): Unsubscribe {
  const q = query(vehiclesCol(uid), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapVehicle)))
}

export async function createVehicle(uid: string, input: { plate: string; nickname?: string }): Promise<string> {
  const ref = doc(vehiclesCol(uid))
  await setDoc(ref, {
    plate: input.plate,
    nickname: input.nickname || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateVehicle(
  uid: string,
  vehicleId: string,
  input: { plate: string; nickname?: string },
): Promise<void> {
  await updateDoc(doc(vehiclesCol(uid), vehicleId), {
    plate: input.plate,
    nickname: input.nickname || null,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteVehicleCascade(uid: string, vehicleId: string): Promise<void> {
  const transactionsRef = collection(db, 'users', uid, 'vehicles', vehicleId, 'transactions')
  const snap = await getDocs(transactionsRef)

  const docs = snap.docs
  const CHUNK = 500
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db)
    for (const d of docs.slice(i, i + CHUNK)) {
      batch.delete(d.ref)
    }
    await batch.commit()
  }

  await deleteDoc(doc(vehiclesCol(uid), vehicleId))
}

// ---- Tags ----

function tagsCol(uid: string) {
  return collection(db, 'users', uid, 'tags')
}

export function subscribeTags(
  uid: string,
  expenseType: ExpenseType,
  callback: (tags: Tag[]) => void,
): Unsubscribe {
  const q = query(tagsCol(uid), where('expenseType', '==', expenseType), orderBy('name', 'asc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapTag)))
}

export async function createTag(uid: string, input: { name: string; expenseType: ExpenseType }): Promise<string> {
  const ref = doc(tagsCol(uid))
  await setDoc(ref, {
    name: input.name,
    expenseType: input.expenseType,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTag(uid: string, tagId: string, name: string): Promise<void> {
  await updateDoc(doc(tagsCol(uid), tagId), { name, updatedAt: serverTimestamp() })
}

export async function deleteTag(uid: string, tagId: string): Promise<void> {
  await deleteDoc(doc(tagsCol(uid), tagId))
}

// ---- Transactions ----

function transactionsCol(uid: string, vehicleId: string) {
  return collection(db, 'users', uid, 'vehicles', vehicleId, 'transactions')
}

export interface TransactionQueryOptions {
  kind?: TransactionKind
  start?: string | null
  end?: string | null
}

export function subscribeTransactions(
  uid: string,
  vehicleId: string,
  opts: TransactionQueryOptions,
  callback: (transactions: Transaction[]) => void,
): Unsubscribe {
  const clauses = []
  if (opts.kind) clauses.push(where('kind', '==', opts.kind))
  if (opts.start) clauses.push(where('date', '>=', opts.start))
  if (opts.end) clauses.push(where('date', '<=', opts.end))
  clauses.push(orderBy('date', 'desc'))

  const q = query(transactionsCol(uid, vehicleId), ...clauses)
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapTransaction)))
}

export async function getTransaction(
  uid: string,
  vehicleId: string,
  transactionId: string,
): Promise<Transaction | null> {
  const snap = await getDoc(doc(transactionsCol(uid, vehicleId), transactionId))
  if (!snap.exists()) return null
  return mapTransaction(snap)
}

export interface TransactionInput {
  kind: TransactionKind
  expenseType?: ExpenseType
  tagId?: string
  tagName?: string
  valueCents: number
  date: string
  description: string
}

export async function createTransaction(uid: string, vehicleId: string, input: TransactionInput): Promise<string> {
  const ref = doc(transactionsCol(uid, vehicleId))
  await setDoc(ref, {
    kind: input.kind,
    expenseType: input.expenseType || null,
    tagId: input.tagId || null,
    tagName: input.tagName || null,
    valueCents: input.valueCents,
    date: input.date,
    description: input.description,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTransaction(
  uid: string,
  vehicleId: string,
  transactionId: string,
  input: TransactionInput,
): Promise<void> {
  await updateDoc(doc(transactionsCol(uid, vehicleId), transactionId), {
    expenseType: input.expenseType || null,
    tagId: input.tagId || null,
    tagName: input.tagName || null,
    valueCents: input.valueCents,
    date: input.date,
    description: input.description,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTransaction(uid: string, vehicleId: string, transactionId: string): Promise<void> {
  await deleteDoc(doc(transactionsCol(uid, vehicleId), transactionId))
}
