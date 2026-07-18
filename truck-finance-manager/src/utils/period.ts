import { format, startOfMonth, subDays } from 'date-fns'
import type { Period } from '../types'

const toDateKey = (d: Date) => format(d, 'yyyy-MM-dd')

export function todayKey(): string {
  return toDateKey(new Date())
}

export interface DateRange {
  start: string | null
  end: string | null
}

export function getPeriodRange(period: Period, now: Date = new Date()): DateRange {
  const end = toDateKey(now)
  switch (period) {
    case 'month':
      return { start: toDateKey(startOfMonth(now)), end }
    case '30d':
      return { start: toDateKey(subDays(now, 29)), end }
    case 'year':
      return { start: toDateKey(subDays(now, 364)), end }
    case 'all':
      return { start: null, end: null }
  }
}
