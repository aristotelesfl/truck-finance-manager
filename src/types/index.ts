export type ExpenseType = 'compra' | 'servico' | 'pagamento'

export type TransactionKind = 'despesa' | 'receita'

export type Period = 'month' | '30d' | 'year' | 'all'

export interface Vehicle {
  id: string
  plate: string
  nickname?: string
  createdAt: number
  updatedAt: number
}

export interface Tag {
  id: string
  name: string
  expenseType: ExpenseType
  createdAt: number
  updatedAt: number
}

export interface Transaction {
  id: string
  kind: TransactionKind
  expenseType?: ExpenseType
  tagId?: string
  tagName?: string
  valueCents: number
  date: string
  description: string
  createdAt: number
  updatedAt: number
}

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  compra: 'Compra',
  servico: 'Serviço',
  pagamento: 'Pagamento',
}

export const PERIOD_LABELS: Record<Period, string> = {
  month: 'Mês atual',
  '30d': 'Últimos 30 dias',
  year: 'Último ano',
  all: 'Tudo',
}
