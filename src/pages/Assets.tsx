import { useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import toast from 'react-hot-toast'
import { Plus, Building2 } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import type { Asset } from '../store/useFinanceStore'
import AssetCard from '../components/assets/AssetCard'
import AssetModal from '../components/assets/AssetModal'
import AssetSummary from '../components/assets/AssetSummary'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'

export default function Assets() {
  const assets = useFinanceStore((s) => s.assets)
  const addAsset = useFinanceStore((s) => s.addAsset)
  const updateAsset = useFinanceStore((s) => s.updateAsset)
  const deleteAsset = useFinanceStore((s) => s.deleteAsset)

  const [listRef] = useAutoAnimate<HTMLDivElement>()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [deleting, setDeleting] = useState<Asset | null>(null)

  return (
    <div className="p-4 pb-6">
      {assets.length > 0 && <AssetSummary assets={assets} />}

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {assets.length} asset{assets.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add Asset
        </Button>
      </div>

      <div ref={listRef} className="flex flex-col gap-3">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onEdit={() => setEditing(asset)}
            onDelete={() => setDeleting(asset)}
          />
        ))}
      </div>

      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--color-card)' }}
          >
            <Building2 size={32} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>No assets yet</p>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Add your real estate, vehicles, or other assets to track your total wealth.
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add First Asset
          </Button>
        </div>
      )}

      <AssetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(data) => {
          addAsset(data)
          toast.success('Asset added')
        }}
      />

      <AssetModal
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={(data) => {
          if (editing) {
            updateAsset(editing.id, data)
            toast.success('Asset updated')
          }
        }}
        initial={editing ?? undefined}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteAsset(deleting.id)
            toast.success('Asset deleted')
            setDeleting(null)
          }
        }}
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
      />
    </div>
  )
}
