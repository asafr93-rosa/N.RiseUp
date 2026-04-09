import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatCurrency, formatDate, INCOME_SOURCE_LABELS, INCOME_SOURCE_COLORS } from '../../lib/formatters'
import type { IncomeEntry } from '../../store/useFinanceStore'

interface Props {
  incomeEntries: IncomeEntry[]
  onAdd: () => void
  onDelete: (id: string) => void
}

export default function IncomeSection({ incomeEntries, onAdd, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true)

  const total = incomeEntries.reduce((s, e) => s + e.amount, 0)
  const sorted = [...incomeEntries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-left" style={{ color: 'var(--color-text-primary)' }}>Income</p>
            <p className="text-xs text-left" style={{ color: '#22C55E' }}>{formatCurrency(total)} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: '#22C55E20', color: '#22C55E' }}
          >
            + Add
          </button>
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          {sorted.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
              No income entries yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {sorted.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      label={INCOME_SOURCE_LABELS[entry.source]}
                      color={INCOME_SOURCE_COLORS[entry.source]}
                      small
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{entry.description}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(entry.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold" style={{ color: '#22C55E' }}>+{formatCurrency(entry.amount)}</p>
                    <button onClick={() => onDelete(entry.id)} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
