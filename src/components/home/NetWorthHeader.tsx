import { useMemo } from 'react'
import AnimatedCounter from '../ui/AnimatedCounter'
import { useFinanceStore } from '../../store/useFinanceStore'

export default function NetWorthHeader() {
  const accounts = useFinanceStore((s) => s.accounts)
  const assets = useFinanceStore((s) => s.assets)
  const investments = useFinanceStore((s) => s.investments)

  const bankTotal = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts])
  const assetTotal = useMemo(() => assets.reduce((s, a) => s + a.estimatedValue, 0), [assets])
  const investTotal = useMemo(() => investments.reduce((s, i) => s + i.currentValue, 0), [investments])
  const netWorth = bankTotal + assetTotal + investTotal

  return (
    <div
      className="p-5 text-center rounded-2xl mb-4"
      style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7B5EA7 100%)', color: '#fff' }}
    >
      <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">Total Net Worth</p>
      <AnimatedCounter value={netWorth} className="text-4xl font-bold block" />

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'Bank Accounts', value: bankTotal },
          { label: 'Assets', value: assetTotal },
          { label: 'Investments', value: investTotal },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl py-2 px-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <p className="text-xs opacity-75">{label}</p>
            <AnimatedCounter value={value} compact className="text-sm font-semibold block mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  )
}
