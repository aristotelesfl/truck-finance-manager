import { useMemo, useState } from 'react'
import {
  Anchor,
  Button,
  Card,
  Center,
  Group,
  Loader,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { DonutChart } from '@mantine/charts'
import { IconMinus, IconPlus } from '@tabler/icons-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { TransactionListItem } from '../components/TransactionListItem'
import { useVehicle } from '../contexts/VehicleContext'
import { useTransactions } from '../hooks/useTransactions'
import { formatCents, centsToNumber } from '../utils/currency'
import { getPeriodRange } from '../utils/period'
import { PERIOD_LABELS } from '../types'
import type { ExpenseType, Period, Transaction } from '../types'

const PERIOD_OPTIONS: { value: Period; label: string }[] = (['month', '30d', 'year', 'all'] as Period[]).map(
  (value) => ({ value, label: PERIOD_LABELS[value] }),
)

const EXPENSE_TYPE_PLURAL: Record<ExpenseType, string> = {
  compra: 'Compras',
  servico: 'Serviços',
  pagamento: 'Pagamentos',
}

const CHART_COLORS = ['blue.6', 'red.6', 'green.6', 'yellow.6', 'grape.6', 'cyan.6', 'orange.6', 'pink.6']

type ChartMode = 'geral' | 'compras' | 'servicos'

const CHART_MODE_OPTIONS: { value: ChartMode; label: string }[] = [
  { value: 'geral', label: 'Despesas geral' },
  { value: 'compras', label: 'Compras por tag' },
  { value: 'servicos', label: 'Serviços por categoria' },
]

function groupByLabel(transactions: Transaction[], labelFn: (t: Transaction) => string) {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    totals.set(labelFn(t), (totals.get(labelFn(t)) ?? 0) + t.valueCents)
  }
  return Array.from(totals.entries())
    .map(([name, cents], index) => ({
      name,
      value: Math.round(centsToNumber(cents) * 100) / 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
}

export function HomeScreen() {
  const { vehicles, loading: vehiclesLoading, activeVehicleId, activeVehicle, setActiveVehicleId } = useVehicle()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('month')
  const [chartMode, setChartMode] = useState<ChartMode>('geral')

  const { start, end } = getPeriodRange(period)

  const { transactions: despesas, loading: despesasLoading } = useTransactions(activeVehicleId, {
    kind: 'despesa',
    start,
    end,
  })
  const { transactions: receitas, loading: receitasLoading } = useTransactions(activeVehicleId, {
    kind: 'receita',
    start,
    end,
  })
  const { transactions: historico, loading: historicoLoading } = useTransactions(activeVehicleId, { start, end })

  const despesaTotalCents = useMemo(() => despesas.reduce((sum, t) => sum + t.valueCents, 0), [despesas])
  const receitaTotalCents = useMemo(() => receitas.reduce((sum, t) => sum + t.valueCents, 0), [receitas])
  const lucroCents = receitaTotalCents - despesaTotalCents

  const chartData = useMemo(() => {
    if (chartMode === 'geral') {
      return groupByLabel(despesas, (t) => EXPENSE_TYPE_PLURAL[t.expenseType ?? 'pagamento'])
    }
    const type: ExpenseType = chartMode === 'compras' ? 'compra' : 'servico'
    const filtered = despesas.filter((t) => t.expenseType === type)
    return groupByLabel(filtered, (t) => t.tagName ?? 'Sem tag')
  }, [chartMode, despesas])

  if (!vehiclesLoading && vehicles.length === 0) {
    return <Navigate to="/vehicles" replace />
  }

  const loadingSummary = despesasLoading || receitasLoading

  return (
    <Stack gap="md" pb="md">
      <Stack gap={4}>
        <Text size="sm" c="dimmed">
          Veículo
        </Text>
        {vehicles.length > 1 ? (
          <Select
            data={vehicles.map((v) => ({ value: v.id, label: v.nickname ? `${v.plate} · ${v.nickname}` : v.plate }))}
            value={activeVehicleId}
            onChange={(v) => v && setActiveVehicleId(v)}
            allowDeselect={false}
          />
        ) : (
          <Title order={2}>{activeVehicle?.plate}</Title>
        )}
      </Stack>

      <SimpleGrid cols={2} spacing="sm">
        <Button
          color="green"
          leftSection={<IconPlus size={18} />}
          onClick={() => navigate('/transactions/new?kind=receita')}
        >
          Nova receita
        </Button>
        <Button
          color="red"
          leftSection={<IconMinus size={18} />}
          onClick={() => navigate('/transactions/new?kind=despesa')}
        >
          Nova despesa
        </Button>
      </SimpleGrid>

      <SegmentedControl
        value={period}
        onChange={(v) => setPeriod(v as Period)}
        data={PERIOD_OPTIONS}
        fullWidth
      />

      {loadingSummary ? (
        <Center py="md">
          <Loader size="sm" />
        </Center>
      ) : (
        <Stack gap="sm">
          <Card withBorder radius="md" padding="md">
            <Text size="sm" c="dimmed">
              Receitas
            </Text>
            <Text size="xl" fw={700} c="green">
              {formatCents(receitaTotalCents)}
            </Text>
          </Card>
          <Card withBorder radius="md" padding="md">
            <Text size="sm" c="dimmed">
              Despesas
            </Text>
            <Text size="xl" fw={700} c="red">
              {formatCents(despesaTotalCents)}
            </Text>
          </Card>
          <Card withBorder radius="md" padding="md">
            <Text size="sm" c="dimmed">
              Lucro
            </Text>
            <Text size="xl" fw={700} c={lucroCents >= 0 ? 'blue' : 'red'}>
              {formatCents(lucroCents)}
            </Text>
          </Card>
        </Stack>
      )}

      <Stack gap="sm">
        <Title order={4}>Gráfico</Title>
        <SegmentedControl
          value={chartMode}
          onChange={(v) => setChartMode(v as ChartMode)}
          data={CHART_MODE_OPTIONS}
          fullWidth
          orientation="vertical"
        />
        {chartData.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="lg">
            Nenhum dado neste período.
          </Text>
        ) : (
          <Center>
            <DonutChart data={chartData} withLabelsLine withLabels size={220} thickness={28} />
          </Center>
        )}
      </Stack>

      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>Histórico de transações</Title>
          <Anchor component={Link} to="/historico" size="sm">
            Ver tudo
          </Anchor>
        </Group>
        {historicoLoading ? (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        ) : historico.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="lg">
            Nenhuma transação neste período.
          </Text>
        ) : (
          <Stack gap="xs">
            {historico.slice(0, 5).map((t) => (
              <TransactionListItem key={t.id} transaction={t} onClick={() => navigate(`/transactions/${t.id}/edit`)} />
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
