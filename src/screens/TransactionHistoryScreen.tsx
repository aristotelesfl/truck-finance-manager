import { useEffect, useMemo, useState } from 'react'
import { Center, Loader, Select, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { TransactionListItem } from '../components/TransactionListItem'
import { useVehicle } from '../contexts/VehicleContext'
import { useTags } from '../hooks/useTags'
import { useTransactions } from '../hooks/useTransactions'
import { getPeriodRange } from '../utils/period'
import { EXPENSE_TYPE_LABELS, PERIOD_LABELS } from '../types'
import type { ExpenseType, Period } from '../types'

const PERIOD_OPTIONS: { value: Period; label: string }[] = (['month', '30d', 'year', 'all'] as Period[]).map(
  (value) => ({ value, label: PERIOD_LABELS[value] }),
)

const KIND_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'despesa', label: 'Despesas' },
  { value: 'receita', label: 'Receitas' },
]

const EXPENSE_TYPE_OPTIONS = [
  { value: 'all', label: 'Todas as categorias' },
  ...(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map((key) => ({ value: key, label: EXPENSE_TYPE_LABELS[key] })),
]

type KindFilter = 'all' | 'despesa' | 'receita'
type ExpenseTypeFilter = 'all' | ExpenseType

export function TransactionHistoryScreen() {
  const navigate = useNavigate()
  const { activeVehicleId } = useVehicle()
  const [period, setPeriod] = useState<Period>('month')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<ExpenseTypeFilter>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const { start, end } = getPeriodRange(period)
  const { transactions, loading } = useTransactions(activeVehicleId, { start, end })
  const { tags } = useTags(expenseTypeFilter === 'all' ? 'compra' : expenseTypeFilter)

  useEffect(() => {
    setTagFilter(null)
  }, [expenseTypeFilter])

  useEffect(() => {
    if (kindFilter === 'receita') {
      setExpenseTypeFilter('all')
    }
  }, [kindFilter])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (kindFilter !== 'all' && t.kind !== kindFilter) return false
      if (kindFilter !== 'receita' && expenseTypeFilter !== 'all' && t.expenseType !== expenseTypeFilter) return false
      if (tagFilter && t.tagId !== tagFilter) return false
      return true
    })
  }, [transactions, kindFilter, expenseTypeFilter, tagFilter])

  return (
    <Stack gap="md" pb="md">
      <Title order={3}>Histórico de transações</Title>

      <Stack gap="sm">
        <SegmentedControl value={period} onChange={(v) => setPeriod(v as Period)} data={PERIOD_OPTIONS} fullWidth />
        <SegmentedControl
          value={kindFilter}
          onChange={(v) => setKindFilter(v as KindFilter)}
          data={KIND_OPTIONS}
          fullWidth
        />
        {kindFilter !== 'receita' && (
          <Select
            data={EXPENSE_TYPE_OPTIONS}
            value={expenseTypeFilter}
            onChange={(v) => v && setExpenseTypeFilter(v as ExpenseTypeFilter)}
            allowDeselect={false}
          />
        )}
        {kindFilter !== 'receita' && expenseTypeFilter !== 'all' && (
          <Select
            placeholder="Todas as tags"
            data={tags.map((t) => ({ value: t.id, label: t.name }))}
            value={tagFilter}
            onChange={setTagFilter}
            clearable
          />
        )}
      </Stack>

      {loading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : filtered.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="lg">
          Nenhuma transação encontrada com esses filtros.
        </Text>
      ) : (
        <Stack gap="xs">
          {filtered.map((t) => (
            <TransactionListItem key={t.id} transaction={t} onClick={() => navigate(`/transactions/${t.id}/edit`)} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
