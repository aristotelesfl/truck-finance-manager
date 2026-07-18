import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './config'

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function logOut() {
  return signOut(auth)
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email)
}

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
