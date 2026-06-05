import { useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import toast from 'react-hot-toast'
import { Plus, TrendingUp } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import type { Investment } from '../store/useFinanceStore'
import InvestmentCard from '../components/investments/InvestmentCard'
import InvestmentModal from '../components/investments/InvestmentModal'
import InvestmentSummary from '../components/investments/InvestmentSummary'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'

export default function Investments() {
  const investments = useFinanceStore((s) => s.investments)
  const addInvestment = useFinanceStore((s) => s.addInvestment)
  const updateInvestment = useFinanceStore((s) => s.updateInvestment)
  const deleteInvestment = useFinanceStore((s) => s.deleteInvestment)

  const [listRef] = useAutoAnimate<HTMLDivElement>()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Investment | null>(null)
  const [deleting, setDeleting] = useState<Investment | null>(null)

  return (
    <div className="p-4 pb-6">
      {investments.length > 0 && <InvestmentSummary investments={investments} />}

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {investments.length} investment{investments.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add Investment
        </Button>
      </div>

      <div ref={listRef} className="flex flex-col gap-3">
        {investments.map((inv) => (
          <InvestmentCard
            key={inv.id}
            investment={inv}
            onEdit={() => setEditing(inv)}
            onDelete={() => setDeleting(inv)}
          />
        ))}
      </div>

      {investments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-card)' }}>
            <TrendingUp size={32} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>No investments yet</p>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Track your pension funds, savings, portfolios and more.
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add First Investment
          </Button>
        </div>
      )}

      <InvestmentModal open={addOpen} onClose={() => setAddOpen(false)} onSave={(data) => { addInvestment(data); toast.success('Investment added') }} />
      <InvestmentModal open={!!editing} onClose={() => setEditing(null)} onSave={(data) => { if (editing) { updateInvestment(editing.id, data); toast.success('Investment updated') } }} initial={editing ?? undefined} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => { if (deleting) { deleteInvestment(deleting.id); toast.success('Investment deleted'); setDeleting(null) } }} message={`Delete "${deleting?.name}"? This cannot be undone.`} />
    </div>
  )
}
