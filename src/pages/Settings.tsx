import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { GripVertical, ArrowLeft, Camera } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFinanceStore } from '../store/useFinanceStore'
import type { RecommendationResource, SupportedCurrency } from '../store/useFinanceStore'
import { fetchLiveRates } from '../lib/exchangeRates'
import { useCurrency } from '../hooks/useCurrency'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

// Stable key for a resource (for dnd-kit id)
function resourceKey(r: RecommendationResource): string {
  if (r.type === 'investment') return `inv-${r.investmentId}`
  return `${r.type}-${r.accountId}`
}

// Check two resources are the same
function sameResource(a: RecommendationResource, b: RecommendationResource): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'investment' && b.type === 'investment') return a.investmentId === b.investmentId
  if ((a.type === 'account' || a.type === 'deposit') && (b.type === 'account' || b.type === 'deposit'))
    return a.accountId === b.accountId
  return false
}

interface SortableItemProps {
  id: string
  title: string
  subtitle: string
  index: number
}

function SortableItem({ id, title, subtitle, index }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span className="text-xs font-bold w-5 text-center shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
        <p className="text-xs" style={{ color: '#4361EE' }}>{subtitle}</p>
      </div>
      <button
        className="p-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const userProfile = useFinanceStore((s) => s.userProfile)
  const updateUserProfile = useFinanceStore((s) => s.updateUserProfile)
  const accounts = useFinanceStore((s) => s.accounts)
  const investments = useFinanceStore((s) => s.investments)
  const appSettings = useFinanceStore((s) => s.appSettings)
  const updateAppSettings = useFinanceStore((s) => s.updateAppSettings)

  const [displayName, setDisplayName] = useState(userProfile.displayName)
  const [avatar, setAvatar] = useState(userProfile.avatar)
  const [age, setAge] = useState<string>(userProfile.age !== null ? String(userProfile.age) : '')
  const [rateLoading, setRateLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { format } = useCurrency()

  // Build full resource list from current accounts + investments
  const allResources = useMemo<RecommendationResource[]>(() => [
    ...accounts.map((a) => ({ type: 'account' as const, accountId: a.id })),
    ...accounts.map((a) => ({ type: 'deposit' as const, accountId: a.id })),
    ...investments.map((inv) => ({ type: 'investment' as const, investmentId: inv.id })),
  ], [accounts, investments])

  // Merge saved priorities with newly discovered resources
  const initialPriorities = useMemo(() => {
    const saved = userProfile.recommendationPriorities.filter((p) => {
      if (!p || typeof p !== 'object') return false
      if (p.type === 'account' || p.type === 'deposit') return accounts.some((a) => a.id === p.accountId)
      if (p.type === 'investment') return investments.some((inv) => inv.id === p.investmentId)
      return false
    })
    const newOnes = allResources.filter((r) => !saved.some((s) => sameResource(s, r)))
    return [...saved, ...newOnes]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentionally only on mount

  const [priorities, setPriorities] = useState<RecommendationResource[]>(initialPriorities)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPriorities((items) => {
        const oldIndex = items.findIndex((r) => resourceKey(r) === active.id)
        const newIndex = items.findIndex((r) => resourceKey(r) === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleRefreshRates() {
    setRateLoading(true)
    try {
      const rates = await fetchLiveRates()
      updateAppSettings({ exchangeRates: rates })
      toast.success('Exchange rates updated')
    } catch {
      toast.error('Failed to fetch rates — check your connection')
    } finally {
      setRateLoading(false)
    }
  }

  function handleSave() {
    if (!displayName.trim()) {
      toast.error('Name is required')
      return
    }
    updateUserProfile({
      displayName: displayName.trim(),
      avatar,
      age: age !== '' ? parseInt(age) || null : null,
      recommendationPriorities: priorities,
    })
    toast.success('Settings saved')
    navigate(-1)
  }

  // Label for each resource
  function resourceLabel(r: RecommendationResource): { title: string; subtitle: string } {
    const currentMonth = new Date().toISOString().slice(0, 7)
    if (r.type === 'account') {
      const a = accounts.find((x) => x.id === r.accountId)
      const bal = a?.balanceHistory?.[currentMonth] ?? 0
      return { title: a?.name ?? 'Unknown Account', subtitle: format(bal, (a?.currency ?? 'ILS') as SupportedCurrency) }
    }
    if (r.type === 'deposit') {
      const a = accounts.find((x) => x.id === r.accountId)
      const dep = a?.depositHistory?.[currentMonth] ?? 0
      return { title: `${a?.name ?? 'Unknown'} – Deposit`, subtitle: format(dep, (a?.currency ?? 'ILS') as SupportedCurrency) }
    }
    const inv = investments.find((x) => x.id === r.investmentId)
    return { title: inv?.name ?? 'Unknown Investment', subtitle: format(inv?.currentValue ?? 0, (inv?.currency ?? 'ILS') as SupportedCurrency) }
  }

  return (
    <div className="p-4 pb-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl"
          style={{ background: 'var(--color-card)', color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
      </div>

      {/* Profile section */}
      <div className="card p-4 flex flex-col gap-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Profile</p>

        {/* Photo upload */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)' }}
          >
            {avatar && avatar.startsWith('data:')
              ? <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
              : <Camera size={24} style={{ color: 'var(--color-text-secondary)' }} />}
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="cursor-pointer text-xs font-medium px-3 py-2 rounded-xl text-center"
              style={{ background: '#4361EE20', color: '#4361EE' }}
            >
              Upload Photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            {avatar && avatar.startsWith('data:') && (
              <button
                onClick={() => setAvatar('')}
                className="text-xs font-medium px-3 py-1.5 rounded-xl"
                style={{ background: '#EF444420', color: '#EF4444' }}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <Input
          label="Display Name"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <Input
          label="Age (optional)"
          type="number"
          inputMode="decimal"
          placeholder="—"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </div>

      {/* Recommendation priorities */}
      <div className="card p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recommendation Priorities</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Drag to reorder. When an account has a negative balance, suggestions appear in this order.
          </p>
        </div>

        {priorities.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
            Add bank accounts or investments to configure priorities.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={priorities.map(resourceKey)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {priorities.map((r, i) => {
                  const { title, subtitle } = resourceLabel(r)
                  return (
                    <SortableItem
                      key={resourceKey(r)}
                      id={resourceKey(r)}
                      title={title}
                      subtitle={subtitle}
                      index={i}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ── Currency Settings ── */}
      <section className="card p-4 flex flex-col gap-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Currency Settings</p>

        {/* Display currency */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Display Currency</label>
          <select
            value={appSettings.displayCurrency}
            onChange={(e) => updateAppSettings({ displayCurrency: e.target.value as SupportedCurrency })}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            {(['ILS', 'USD', 'EUR', 'GBP'] as SupportedCurrency[]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Enabled input currencies */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Available Input Currencies</label>
          {(['ILS', 'USD', 'EUR', 'GBP'] as SupportedCurrency[]).map((c) => {
            const enabled = appSettings.enabledCurrencies.includes(c)
            const isILS = c === 'ILS'
            return (
              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={isILS}
                  onChange={() => {
                    const next = enabled
                      ? appSettings.enabledCurrencies.filter((x) => x !== c)
                      : [...appSettings.enabledCurrencies, c]
                    updateAppSettings({ enabledCurrencies: next })
                  }}
                  className="rounded"
                />
                <span style={{ color: isILS ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                  {c}{isILS ? ' (always on)' : ''}
                </span>
              </label>
            )
          })}
        </div>

        {/* Exchange rates */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Exchange Rates (to ILS)</label>
            <button
              onClick={() => void handleRefreshRates()}
              disabled={rateLoading}
              className="text-xs px-3 py-1 rounded-lg font-medium"
              style={{ background: 'var(--color-accent-light)', color: '#4361EE' }}
            >
              {rateLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {appSettings.exchangeRates.lastUpdated && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Last updated: {new Date(appSettings.exchangeRates.lastUpdated).toLocaleString()}
            </p>
          )}
          <div className="flex flex-col gap-1 text-sm">
            {(['USD', 'EUR', 'GBP'] as const).map((cur) => {
              const rateVal = cur === 'USD' ? appSettings.exchangeRates.USD_ILS : cur === 'EUR' ? appSettings.exchangeRates.EUR_ILS : appSettings.exchangeRates.GBP_ILS
              return (
                <div key={cur} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>1 {cur}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    ₪ {rateVal.toFixed(4)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Button variant="primary" onClick={handleSave}>Save Settings</Button>

      <p className="text-center text-xs py-2" style={{ color: 'var(--color-text-secondary)' }}>v2.3</p>
    </div>
  )
}
