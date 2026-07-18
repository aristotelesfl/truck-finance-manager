import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCents } from './currency'
import { EXPENSE_TYPE_LABELS } from '../types'
import type { ExpenseType, Transaction } from '../types'

function formatDate(isoDate: string): string {
  return isoDate.split('-').reverse().join('/')
}

interface ReportParams {
  vehicleLabel: string
  periodLabel: string
  rangeLabel: string
  kindLabel: string
  transactions: Transaction[]
}

export function generateTransactionReportPdf({ vehicleLabel, periodLabel, rangeLabel, kindLabel, transactions }: ReportParams): void {
  const doc = new jsPDF()

  const despesas = transactions.filter((t) => t.kind === 'despesa')
  const receitas = transactions.filter((t) => t.kind === 'receita')
  const despesaTotal = despesas.reduce((sum, t) => sum + t.valueCents, 0)
  const receitaTotal = receitas.reduce((sum, t) => sum + t.valueCents, 0)
  const lucro = receitaTotal - despesaTotal

  doc.setFontSize(16)
  doc.text(`Relatório de ${kindLabel}`, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Veículo: ${vehicleLabel}`, 14, 26)
  doc.text(`Período: ${periodLabel} (${rangeLabel})`, 14, 31)
  doc.text(`Gerado em: ${formatDate(new Date().toISOString().slice(0, 10))}`, 14, 36)

  doc.setTextColor(0)
  doc.setFontSize(11)
  let y = 46
  if (receitas.length > 0) {
    doc.text(`Receitas: ${formatCents(receitaTotal)}`, 14, y)
    y += 6
  }
  if (despesas.length > 0) {
    doc.text(`Despesas: ${formatCents(despesaTotal)}`, 14, y)
    y += 6
  }
  if (receitas.length > 0 && despesas.length > 0) {
    doc.text(`Lucro: ${formatCents(lucro)}`, 14, y)
    y += 6
  }
  y += 4

  if (despesas.length > 0) {
    const byCategory = new Map<ExpenseType, number>()
    for (const t of despesas) {
      const key = t.expenseType ?? 'pagamento'
      byCategory.set(key, (byCategory.get(key) ?? 0) + t.valueCents)
    }
    autoTable(doc, {
      startY: y,
      head: [['Categoria', 'Total']],
      body: Array.from(byCategory.entries()).map(([type, cents]) => [EXPENSE_TYPE_LABELS[type], formatCents(cents)]),
      theme: 'striped',
      headStyles: { fillColor: [30, 90, 170] },
      margin: { left: 14, right: 14 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
  autoTable(doc, {
    startY: y,
    head: [['Data', 'Tipo', 'Categoria/Tag', 'Descrição', 'Valor']],
    body: sorted.map((t) => [
      formatDate(t.date),
      t.kind === 'despesa' ? 'Despesa' : 'Receita',
      t.kind === 'despesa' ? `${t.expenseType ? EXPENSE_TYPE_LABELS[t.expenseType] : ''}${t.tagName ? ` · ${t.tagName}` : ''}` : '-',
      t.description || '-',
      `${t.kind === 'despesa' ? '-' : '+'}${formatCents(t.valueCents)}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 90, 170] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
  })

  const fileDate = new Date().toISOString().slice(0, 10)
  doc.save(`relatorio-${vehicleLabel.replace(/\s+/g, '_')}-${fileDate}.pdf`)
}
