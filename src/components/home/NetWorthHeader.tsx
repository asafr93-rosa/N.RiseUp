import { useMemo } from 'react'
import AnimatedCounter from '../ui/AnimatedCounter'
import { useFinanceStore } from '../../store/useFinanceStore'
import { convertAmount } from '../../lib/formatters'

export default function NetWorthHeader() {
  const accounts = useFinanceStore((s) => s.accounts)
  const assets = useFinanceStore((s) => s.assets)
  const investments = useFinanceStore((s) => s.investments)
  const { displayCurrency, exchangeRates } = useFinanceStore((s) => s.appSettings)

  const bankTotal = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    return accounts.reduce((s, a) => {
      const cur = a.currency ?? 'ILS'
      const balance = a.balanceHistory?.[month] ?? 0
      return s + convertAmount(balance, cur, displayCurrency, exchangeRates)
    }, 0)
  }, [accounts, displayCurrency, exchangeRates])

  const assetTotal = useMemo(() =>
    assets.reduce((s, a) => s + convertAmount(a.estimatedValue, a.currency ?? 'ILS', displayCurrency, exchangeRates), 0),
  [assets, displayCurrency, exchangeRates])

  const investTotal = useMemo(() =>
    investments.reduce((s, i) => s + convertAmount(i.currentValue, i.currency ?? 'ILS', displayCurrency, exchangeRates), 0),
  [investments, displayCurrency, exchangeRates])

  const netWorth = bankTotal + assetTotal + investTotal

  return (
    <div className="hero-card p-5 mb-4">
      {/* Label */}
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
        Net Worth
      </p>

      {/* Hero number */}
      <span style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.04em', fontFamily: '"DM Mono", monospace', color: 'var(--color-text-primary)', display: 'block', marginTop: '4px', marginBottom: '16px' }}>
        <AnimatedCounter value={netWorth} alreadyConverted className="" />
      </span>

      {/* Sub-pills */}
      <div className="flex gap-2">
        {[
          { label: 'Bank', value: bankTotal },
          { label: 'Assets', value: assetTotal },
          { label: 'Invest', value: investTotal },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex-1 rounded-xl px-2 py-2"
            style={{ background: 'var(--color-card-elevated)' }}
          >
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: '"DM Mono", monospace', color: 'var(--color-text-primary)', display: 'block', marginTop: '2px' }}>
              <AnimatedCounter value={value} alreadyConverted className="" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
