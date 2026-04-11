import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Badge from '../ui/Badge'
import { formatPercent, formatCurrencyIn, convertAmount, INVESTMENT_TYPE_LABELS, INVESTMENT_TYPE_COLORS } from '../../lib/formatters'
import { useCurrency } from '../../hooks/useCurrency'
import { useFinanceStore } from '../../store/useFinanceStore'
import type { Investment, SupportedCurrency } from '../../store/useFinanceStore'
import CurrencyInput from '../ui/CurrencyInput'

interface Props {
  investment: Investment
  onEdit: () => void
  onDelete: () => void
}

function shortMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

export default function InvestmentCard({ investment: inv, onEdit, onDelete }: Props) {
  const { format, rates, displayCurrency } = useCurrency()
  const addInvestmentHistoryEntry = useFinanceStore((s) => s.addInvestmentHistoryEntry)
  const removeInvestmentHistoryEntry = useFinanceStore((s) => s.removeInvestmentHistoryEntry)
  const enabledCurrencies = useFinanceStore((s) => s.appSettings.enabledCurrencies)

  const invCurrency = (inv.currency ?? 'ILS') as SupportedCurrency
  const contribCurrency = (inv.contributionCurrency ?? 'ILS') as SupportedCurrency
  const color = INVESTMENT_TYPE_COLORS[inv.type]

  const accFee = convertAmount(inv.currentValue, invCurrency, displayCurrency, rates) * inv.managementFeeAccumulationPct / 100
  const contribFee = convertAmount(inv.monthlyContribution, contribCurrency, displayCurrency, rates) * 12 * inv.managementFeeContributionPct / 100

  const showChart = inv.valueHistory && inv.valueHistory.length >= 2
  const chartData = showChart
    ? inv.valueHistory.map((h) => ({ month: shortMonth(h.month), value: h.value }))
    : []

  const sortedHistory = [...(inv.valueHistory ?? [])].sort((a, b) => a.month.localeCompare(b.month))
  const prevEntry = sortedHistory.length >= 2 ? sortedHistory[sortedHistory.length - 2] : null
  const monthlyDiff = prevEntry !== null ? inv.currentValue - prevEntry.value : null
  const monthlyPct = prevEntry !== null && prevEntry.value !== 0
    ? ((inv.currentValue - prevEntry.value) / Math.abs(prevEntry.value)) * 100
    : null

  // Add history form state
  const [addingHistory, setAddingHistory] = useState(false)
  const [histMonth, setHistMonth] = useState('')
  const [histValue, setHistValue] = useState(0)
  const [histCurrency, setHistCurrency] = useState<SupportedCurrency>(invCurrency)

  // Edit history entry state
  const [editingMonth, setEditingMonth] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(0)
  const [editCurrency, setEditCurrency] = useState<SupportedCurrency>(invCurrency)

  // History list visibility
  const [showHistory, setShowHistory] = useState(false)

  function openHistoryForm() {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    setHistMonth(d.toISOString().slice(0, 7))
    setHistValue(0)
    setHistCurrency(invCurrency)
    setAddingHistory(true)
  }

  function saveHistory() {
    if (!histMonth || histValue <= 0) return
    addInvestmentHistoryEntry(inv.id, histMonth, convertAmount(histValue, histCurrency, invCurrency, rates))
    setAddingHistory(false)
  }

  function startEditEntry(month: string, storedValue: number) {
    setEditingMonth(month)
    setEditValue(storedValue)
    setEditCurrency(invCurrency)
  }

  function saveEditEntry() {
    if (!editingMonth || editValue <= 0) return
    addInvestmentHistoryEntry(inv.id, editingMonth, convertAmount(editValue, editCurrency, invCurrency, rates))
    setEditingMonth(null)
  }

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge label={INVESTMENT_TYPE_LABELS[inv.type]} color={color} small />
          </div>
          <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
            {inv.name}
          </h3>
          {inv.managingInstitution && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {inv.managingInstitution}
            </p>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg" style={{ color: '#EF4444', background: 'var(--color-card)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Current Value</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {format(inv.currentValue, invCurrency)}
        </p>
        {invCurrency !== displayCurrency && (
          <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
            {formatCurrencyIn(inv.currentValue, invCurrency)}
          </p>
        )}
        {monthlyDiff !== null && monthlyPct !== null && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>vs last month</span>
            <span className="text-xs font-semibold" style={{ color: monthlyDiff >= 0 ? '#22C55E' : '#EF4444' }}>
              {monthlyDiff >= 0 ? '+' : ''}{format(monthlyDiff ?? 0, invCurrency)}
            </span>
            <span className="text-xs" style={{ color: monthlyDiff >= 0 ? '#22C55E' : '#EF4444' }}>
              ({formatPercent(monthlyPct)})
            </span>
          </div>
        )}
      </div>

      {showChart && (
        <div className="mt-3" style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [formatCurrencyIn(convertAmount(Number(v), invCurrency, displayCurrency, rates), displayCurrency), 'Value']}
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--color-text-primary)',
                }}
                cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
              />
              <Bar dataKey="value" fill="#4361EE" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {inv.monthlyContribution > 0 && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Monthly</p>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {format(inv.monthlyContribution, contribCurrency)}
            </p>
            {contribCurrency !== displayCurrency && (
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {formatCurrencyIn(inv.monthlyContribution, contribCurrency)}
              </p>
            )}
          </div>
        )}
        {inv.managementFeeAccumulationPct > 0 && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Balance fee / yr</p>
            <p className="font-medium" style={{ color: '#EF4444' }}>
              {formatCurrencyIn(accFee, displayCurrency)}
            </p>
          </div>
        )}
        {inv.managementFeeContributionPct > 0 && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Contribution fee / yr</p>
            <p className="font-medium" style={{ color: '#EF4444' }}>
              {formatCurrencyIn(contribFee, displayCurrency)}
            </p>
          </div>
        )}
      </div>

      {inv.description && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {inv.description}
        </p>
      )}

      {/* Add past month value */}
      {addingHistory ? (
        <div className="mt-3 flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Add past month value</p>
          <input
            type="month"
            value={histMonth}
            onChange={(e) => setHistMonth(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
          <CurrencyInput
            value={histValue}
            currency={histCurrency}
            enabledCurrencies={enabledCurrencies}
            onValueChange={setHistValue}
            onCurrencyChange={setHistCurrency}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setAddingHistory(false)}
              className="flex-1 text-xs py-1.5 rounded-lg"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              Cancel
            </button>
            <button
              onClick={saveHistory}
              disabled={!histMonth || histValue <= 0}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium"
              style={{ background: '#4361EE20', color: '#4361EE', border: '1px solid #4361EE40' }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={openHistoryForm}
          className="mt-3 w-full text-xs py-1.5 rounded-lg"
          style={{ color: 'var(--color-text-secondary)', border: '1px dashed var(--color-border)' }}
        >
          + Add past month value
        </button>
      )}

      {/* Value history list */}
      {sortedHistory.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1 text-xs w-full py-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Value history ({sortedHistory.length})
          </button>

          {showHistory && (
            <div className="mt-1 flex flex-col gap-1">
              {[...sortedHistory].reverse().map((entry) => (
                <div key={entry.month}>
                  {editingMonth === entry.month ? (
                    <div className="flex flex-col gap-2 p-2 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>{shortMonth(entry.month)}</p>
                      <CurrencyInput
                        value={editValue}
                        currency={editCurrency}
                        enabledCurrencies={enabledCurrencies}
                        onValueChange={setEditValue}
                        onCurrencyChange={setEditCurrency}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingMonth(null)}
                          className="flex-1 text-xs py-1 rounded-lg"
                          style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditEntry}
                          disabled={editValue <= 0}
                          className="flex-1 text-xs py-1 rounded-lg font-medium"
                          style={{ background: '#4361EE20', color: '#4361EE', border: '1px solid #4361EE40' }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs" style={{ background: 'var(--color-surface)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{shortMonth(entry.month)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {format(entry.value, invCurrency)}
                        </span>
                        <button onClick={() => startEditEntry(entry.month, entry.value)} className="p-0.5 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => removeInvestmentHistoryEntry(inv.id, entry.month)} className="p-0.5 rounded" style={{ color: '#EF4444' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
