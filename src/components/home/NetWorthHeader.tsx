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
    assets.reduce((s, a) =>
      s + convertAmount(a.estimatedValue, a.currency ?? 'ILS', displayCurrency, exchangeRates), 0),
  [assets, displayCurrency, exchangeRates])

  const investTotal = useMemo(() =>
    investments.reduce((s, i) =>
      s + convertAmount(i.currentValue, i.currency ?? 'ILS', displayCurrency, exchangeRates), 0),
  [investments, displayCurrency, exchangeRates])

  const netWorth = bankTotal + assetTotal + investTotal

  return (
    <div
      className="p-5 text-center rounded-2xl mb-4"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7B5EA7 100%)', color: '#fff' }}
    >
      <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">Total Net Worth</p>
      <AnimatedCounter value={netWorth} alreadyConverted className="text-4xl font-bold block" />

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'Bank Accounts', value: bankTotal },
          { label: 'Assets', value: assetTotal },
          { label: 'Investments', value: investTotal },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl py-2 px-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <p className="text-xs opacity-75">{label}</p>
            <AnimatedCounter value={value} alreadyConverted className="text-sm font-semibold block mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  )
}
