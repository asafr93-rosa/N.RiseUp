import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { GripVertical, ArrowLeft } from 'lucide-react'
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
import type { RecommendationPriority } from '../store/useFinanceStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const AVATARS = ['👤', '👨', '👩', '🧑', '👴', '👵', '🧔']

const PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  deposit: 'Use account deposit',
  transfer: 'Transfer between accounts',
  reduce_recurring: 'Reduce fixed expenses',
  reduce_spending: 'Reduce variable spending',
}

interface SortableItemProps {
  id: RecommendationPriority
  index: number
}

function SortableItem({ id, index }: SortableItemProps) {
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
      <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        {index + 1}
      </span>
      <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {PRIORITY_LABELS[id]}
      </span>
      <button
        className="p-1 cursor-grab active:cursor-grabbing touch-none"
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

  const [displayName, setDisplayName] = useState(userProfile.displayName)
  const [avatar, setAvatar] = useState(userProfile.avatar)
  const [age, setAge] = useState<string>(userProfile.age !== null ? String(userProfile.age) : '')
  const [priorities, setPriorities] = useState<RecommendationPriority[]>(userProfile.recommendationPriorities)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPriorities((items) => {
        const oldIndex = items.indexOf(active.id as RecommendationPriority)
        const newIndex = items.indexOf(over.id as RecommendationPriority)
        return arrayMove(items, oldIndex, newIndex)
      })
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

        {/* Avatar picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className="w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: avatar === emoji ? '#4361EE20' : 'var(--color-surface)',
                  border: avatar === emoji ? '2px solid #4361EE' : '2px solid transparent',
                }}
              >
                {emoji}
              </button>
            ))}
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={priorities} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {priorities.map((p, i) => (
                <SortableItem key={p} id={p} index={i} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Save */}
      <Button variant="primary" onClick={handleSave}>Save Settings</Button>
    </div>
  )
}
