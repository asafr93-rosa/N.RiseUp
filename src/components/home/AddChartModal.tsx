import { useState } from 'react'
import { BarChart2, PieChart, TrendingUp } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { ChartType, ChartDataSource, ChartTimeRange, ChartWidget, ExpenseCategory } from '../../store/useFinanceStore'
import { CATEGORY_LABELS } from '../../lib/formatters'

type FormData = Omit<ChartWidget, 'id' | 'order'>

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (data: FormData) => void
}

const DATA_SOURCES: { value: ChartDataSource; label: string; desc: string }[] = [
  { value: 'expenses_by_category', label: 'Expenses by category', desc: 'How spending breaks down across categories' },
  { value: 'expenses_by_month', label: 'Expenses by month', desc: 'Monthly spending trend over time' },
  { value: 'balance_over_time', label: 'Balance over time', desc: 'Account balance history' },
  { value: 'category_comparison', label: 'Category comparison', desc: 'Compare categories across months' },
]

const TIME_RANGES: { value: ChartTimeRange; label: string }[] = [
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
  { value: 'all', label: 'All time' },
]

const CHART_TYPES: { value: ChartType; Icon: React.ElementType; label: string }[] = [
  { value: 'bar', Icon: BarChart2, label: 'Bar' },
  { value: 'pie', Icon: PieChart, label: 'Pie' },
  { value: 'line', Icon: TrendingUp, label: 'Line' },
]

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

const DEFAULT: FormData = {
  chartType: 'bar',
  dataSource: 'expenses_by_category',
  timeRange: '3m',
  filterCategory: 'all',
  filterAccountId: null,
  title: '',
}

export default function AddChartModal({ open, onClose, onAdd }: Props) {
  const [form, setForm] = useState<FormData>(DEFAULT)

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleAdd() {
    onAdd({ ...form, title: form.title || (DATA_SOURCES.find((d) => d.value === form.dataSource)?.label ?? 'Chart') })
    setForm(DEFAULT)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Chart Widget" maxWidth="max-w-lg">
      <div className="flex flex-col gap-5">
        {/* Chart type */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Chart type</p>
          <div className="grid grid-cols-3 gap-2">
            {CHART_TYPES.map(({ value, Icon, label }) => (
              <button
                key={value}
                onClick={() => set('chartType', value)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors"
                style={{
                  borderColor: form.chartType === value ? '#4361EE' : 'var(--color-border)',
                  background: form.chartType === value ? '#4361EE10' : 'var(--color-card)',
                  color: form.chartType === value ? '#4361EE' : 'var(--color-text-secondary)',
                }}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data source */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Data</p>
          <div className="flex flex-col gap-2">
            {DATA_SOURCES.map((ds) => (
              <button
                key={ds.value}
                onClick={() => set('dataSource', ds.value)}
                className="flex flex-col items-start px-3 py-2.5 rounded-xl border transition-colors text-left"
                style={{
                  borderColor: form.dataSource === ds.value ? '#4361EE' : 'var(--color-border)',
                  background: form.dataSource === ds.value ? '#4361EE10' : 'var(--color-card)',
                }}
              >
                <span className="text-sm font-medium" style={{ color: form.dataSource === ds.value ? '#4361EE' : 'var(--color-text-primary)' }}>{ds.label}</span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{ds.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        {(form.dataSource === 'expenses_by_category' || form.dataSource === 'expenses_by_month') && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category filter</label>
            <select value={form.filterCategory} onChange={(e) => set('filterCategory', e.target.value as ExpenseCategory | 'all')} className="w-full px-3 py-2 text-sm rounded-xl outline-none" style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
              <option value="all">All categories</option>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}

        {/* Time range */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Time range</p>
          <div className="flex gap-2 flex-wrap">
            {TIME_RANGES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => set('timeRange', value)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                style={{
                  borderColor: form.timeRange === value ? '#4361EE' : 'var(--color-border)',
                  background: form.timeRange === value ? '#4361EE' : 'var(--color-card)',
                  color: form.timeRange === value ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input label="Widget title (optional)" placeholder="e.g. Monthly food spending" value={form.title} onChange={(e) => set('title', e.target.value)} />

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleAdd}>Add Widget</Button>
        </div>
      </div>
    </Modal>
  )
}
