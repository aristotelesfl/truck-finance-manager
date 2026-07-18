import { useEffect, useState } from 'react'
import { subscribeTransactions, type TransactionQueryOptions } from '../firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import type { Transaction } from '../types'

export function useTransactions(vehicleId: string | null, opts: TransactionQueryOptions) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !vehicleId) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeTransactions(user.uid, vehicleId, opts, (next) => {
      setTransactions(next)
      setLoading(false)
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, vehicleId, opts.kind, opts.start, opts.end])

  return { transactions, loading }
}
