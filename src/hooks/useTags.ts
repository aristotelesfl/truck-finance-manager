import { useEffect, useState } from 'react'
import { subscribeTags } from '../firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import type { ExpenseType, Tag } from '../types'

export function useTags(expenseType: ExpenseType) {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTags([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeTags(user.uid, expenseType, (nextTags) => {
      setTags(nextTags)
      setLoading(false)
    })
    return unsubscribe
  }, [user, expenseType])

  return { tags, loading }
}
