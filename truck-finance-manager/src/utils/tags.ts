import type { ExpenseType } from '../types'

export const DEFAULT_TAGS: Record<ExpenseType, string[]> = {
  compra: ['Pneu', 'Óleo', 'Peças em geral'],
  servico: ['Manutenção', 'Mão de obra', 'Outros'],
  pagamento: ['Financiamento', 'Multa', 'Pedágio', 'Seguro'],
}
