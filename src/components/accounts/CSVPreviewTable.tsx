import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/formatters'
import { formatCurrency, formatDate } from '../../lib/formatters'
import type { ParsedRow } from '../../lib/csvParser'
import type { ExpenseCategory } from '../../store/useFinanceStore'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

export interface PreviewRow extends ParsedRow {
  excluded: boolean
}

interface Props {
  rows: PreviewRow[]
  onCategoryChange: (index: number, category: ExpenseCategory) => void
  onDescriptionChange?: (index: number, value: string) => void
  onToggleExclude?: (index: number) => void
}

export default function CSVPreviewTable({ rows, onCategoryChange, onDescriptionChange, onToggleExclude }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="border-b" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            {onToggleExclude && <th className="px-3 py-2 w-8" />}
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Date</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Description</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category</th>
            <th className="text-right px-3 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b transition-opacity"
              style={{
                borderColor: 'var(--color-border)',
                opacity: row.excluded ? 0.35 : 1,
              }}
            >
              {onToggleExclude && (
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!row.excluded}
                    onChange={() => onToggleExclude(i)}
                    className="cursor-pointer"
                    style={{ accentColor: 'var(--color-accent)' }}
                  />
                </td>
              )}
              <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(row.date)}</td>
              <td className="px-3 py-2 max-w-[160px]">
                {onDescriptionChange && !row.excluded ? (
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => onDescriptionChange(i, e.target.value)}
                    className="w-full bg-transparent outline-none text-xs"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                ) : (
                  <span className="truncate block" style={{ color: 'var(--color-text-primary)' }}>{row.description}</span>
                )}
              </td>
              <td className="px-3 py-2">
                {row.type === 'expense' ? (
                  <select
                    value={row.category}
                    onChange={(e) => onCategoryChange(i, e.target.value as ExpenseCategory)}
                    disabled={row.excluded}
                    className="text-xs px-1.5 py-0.5 rounded-lg outline-none w-full max-w-[130px]"
                    style={{ background: `${CATEGORY_COLORS[row.category]}20`, color: CATEGORY_COLORS[row.category], border: 'none' }}
                  >
                    {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#10b98120', color: '#10b981' }}>Income</span>
                )}
              </td>
              <td className="px-3 py-2 text-right font-medium whitespace-nowrap" style={{ color: row.type === 'income' ? '#10b981' : '#f43f5e' }}>
                {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
