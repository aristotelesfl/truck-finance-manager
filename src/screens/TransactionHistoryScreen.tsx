import { useMemo } from 'react'
import { ActionIcon, Button, Center, Group, Loader, Select, SegmentedControl, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconFileTypePdf, IconSortAscending, IconSortDescending } from '@tabler/icons-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { TransactionListItem } from '../components/TransactionListItem'
import { useVehicle } from '../contexts/VehicleContext'
import { useTags } from '../hooks/useTags'
import { useTransactions } from '../hooks/useTransactions'
import { getPeriodRange } from '../utils/period'
import { generateTransactionReportPdf } from '../utils/pdfReport'
import { EXPENSE_TYPE_LABELS, PERIOD_LABELS } from '../types'
import type { ExpenseType, Period } from '../types'

function formatDateLabel(isoDate: string): string {
  return isoDate.split('-').reverse().join('/')
}

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

const SORT_OPTIONS = [
  { value: 'date', label: 'Data da transação' },
  { value: 'createdAt', label: 'Data de lançamento' },
  { value: 'value', label: 'Valor' },
]

type KindFilter = 'all' | 'despesa' | 'receita'
type ExpenseTypeFilter = 'all' | ExpenseType
type SortField = 'date' | 'createdAt' | 'value'
type SortDirection = 'asc' | 'desc'

export function TransactionHistoryScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeVehicleId, activeVehicle } = useVehicle()
  const [searchParams, setSearchParams] = useSearchParams()

  const period = (searchParams.get('period') as Period | null) ?? 'month'
  const kindFilter = (searchParams.get('kind') as KindFilter | null) ?? 'all'
  const expenseTypeFilter = (searchParams.get('type') as ExpenseTypeFilter | null) ?? 'all'
  const tagFilter = searchParams.get('tag')
  const sortField = (searchParams.get('sort') as SortField | null) ?? 'date'
  const sortDirection = (searchParams.get('dir') as SortDirection | null) ?? 'desc'

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(updates)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  const { start, end } = getPeriodRange(period)
  const { transactions, loading } = useTransactions(activeVehicleId, { start, end })
  const { tags } = useTags(expenseTypeFilter === 'all' ? 'compra' : expenseTypeFilter)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (kindFilter !== 'all' && t.kind !== kindFilter) return false
      if (kindFilter !== 'receita' && expenseTypeFilter !== 'all' && t.expenseType !== expenseTypeFilter) return false
      if (tagFilter && t.tagId !== tagFilter) return false
      return true
    })
  }, [transactions, kindFilter, expenseTypeFilter, tagFilter])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      const diff =
        sortField === 'date' ? a.date.localeCompare(b.date) : sortField === 'createdAt' ? a.createdAt - b.createdAt : a.valueCents - b.valueCents
      return sortDirection === 'asc' ? diff : -diff
    })
    return list
  }, [filtered, sortField, sortDirection])

  const handleExportPdf = () => {
    if (!activeVehicle) return
    const kindLabel = kindFilter === 'despesa' ? 'Despesas' : kindFilter === 'receita' ? 'Receitas' : 'Transações'
    const rangeLabel = start && end ? `${formatDateLabel(start)} a ${formatDateLabel(end)}` : 'todo o período'
    generateTransactionReportPdf({
      vehicleLabel: activeVehicle.nickname ? `${activeVehicle.plate} (${activeVehicle.nickname})` : activeVehicle.plate,
      periodLabel: PERIOD_LABELS[period],
      rangeLabel,
      kindLabel,
      transactions: filtered,
    })
  }

  const openTransaction = (id: string) => {
    navigate(`/transactions/${id}/edit`, { state: { from: location.pathname + location.search } })
  }

  return (
    <Stack gap="md" pb="md">
      <Title order={3}>Histórico de transações</Title>

      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <SegmentedControl
            value={period}
            onChange={(v) => updateParams({ period: v })}
            data={PERIOD_OPTIONS}
            fullWidth
          />
          <SegmentedControl
            value={kindFilter}
            onChange={(v) => updateParams(v === 'receita' ? { kind: v, type: null, tag: null } : { kind: v })}
            data={KIND_OPTIONS}
            fullWidth
          />
          {kindFilter !== 'receita' && (
            <Select
              data={EXPENSE_TYPE_OPTIONS}
              value={expenseTypeFilter}
              onChange={(v) => v && updateParams({ type: v, tag: null })}
              allowDeselect={false}
            />
          )}
          {kindFilter !== 'receita' && (
            <Select
              placeholder="Todas as tags"
              data={tags.map((t) => ({ value: t.id, label: t.name }))}
              value={tagFilter}
              onChange={(v) => updateParams({ tag: v })}
              disabled={expenseTypeFilter === 'all'}
              clearable
            />
          )}
          <Group gap="xs" wrap="nowrap">
            <Select
              data={SORT_OPTIONS}
              value={sortField}
              onChange={(v) => v && updateParams({ sort: v })}
              allowDeselect={false}
              style={{ flex: 1 }}
            />
            <ActionIcon
              variant="default"
              size="lg"
              onClick={() => updateParams({ dir: sortDirection === 'asc' ? 'desc' : 'asc' })}
              aria-label={sortDirection === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
            >
              {sortDirection === 'asc' ? <IconSortAscending size={18} /> : <IconSortDescending size={18} />}
            </ActionIcon>
          </Group>
        </SimpleGrid>
        <Button
          variant="light"
          leftSection={<IconFileTypePdf size={18} />}
          onClick={handleExportPdf}
          disabled={filtered.length === 0}
        >
          Exportar PDF
        </Button>
      </Stack>

      {loading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : sorted.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="lg">
          Nenhuma transação encontrada com esses filtros.
        </Text>
      ) : (
        <Stack gap="xs">
          {sorted.map((t) => (
            <TransactionListItem key={t.id} transaction={t} onClick={() => openTransaction(t.id)} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
