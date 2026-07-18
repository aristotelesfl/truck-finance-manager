import { Card, Group, Stack, Text } from '@mantine/core'
import { formatCents } from '../utils/currency'
import { EXPENSE_TYPE_LABELS } from '../types'
import type { Transaction } from '../types'

interface TransactionListItemProps {
  transaction: Transaction
  onClick: () => void
}

export function TransactionListItem({ transaction: t, onClick }: TransactionListItemProps) {
  return (
    <Card withBorder radius="md" padding="sm" style={{ cursor: 'pointer' }} onClick={onClick}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={0} style={{ minWidth: 0, maxWidth: '50%' }}>
          <Text size="sm" fw={500}>
            {t.kind === 'despesa' ? (t.expenseType ? EXPENSE_TYPE_LABELS[t.expenseType] : 'Despesa') : 'Receita'}
            {t.tagName ? ` · ${t.tagName}` : ''}
          </Text>
          {t.description && (
            <Text size="xs" c="dimmed" truncate="end">
              {t.description}
            </Text>
          )}
        </Stack>
        <Stack gap={0} align="flex-end">
          <Text size="xs" c="dimmed">
            {t.date.split('-').reverse().join('/')}
          </Text>
          <Text fw={600} c={t.kind === 'despesa' ? 'red' : 'green'}>
            {t.kind === 'despesa' ? '-' : '+'}
            {formatCents(t.valueCents)}
          </Text>
        </Stack>
      </Group>
    </Card>
  )
}
