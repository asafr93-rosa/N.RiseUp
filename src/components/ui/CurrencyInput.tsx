import type { SupportedCurrency } from '../../store/useFinanceStore'

interface Props {
  label?: string
  value: number
  currency: SupportedCurrency
  enabledCurrencies: SupportedCurrency[]
  onValueChange: (value: number) => void
  onCurrencyChange: (currency: SupportedCurrency) => void
  error?: string
}

const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  ILS: '₪ ILS', USD: '$ USD', EUR: '€ EUR', GBP: '£ GBP',
}

export default function CurrencyInput({
  label, value, currency, enabledCurrencies, onValueChange, onCurrencyChange, error,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: `1px solid ${error ? '#f87171' : 'var(--color-border)'}` }}
      >
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={value || ''}
          onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
          className="flex-1 px-3 py-2 text-sm outline-none min-w-0"
          style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)' }}
        />
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as SupportedCurrency)}
          className="px-2 py-2 text-xs font-medium outline-none shrink-0 border-l"
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          {enabledCurrencies.map((c) => (
            <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
