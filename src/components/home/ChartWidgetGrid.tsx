import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical } from 'lucide-react'
import ChartWidget from './ChartWidget'
import Button from '../ui/Button'
import type { ChartWidget as ChartWidgetType } from '../../store/useFinanceStore'

interface SortableWidgetProps {
  widget: ChartWidgetType
  onDelete: () => void
}

function SortableWidget({ widget, onDelete }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative">
        <div
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-1 rounded"
          style={{ color: 'var(--color-text-secondary)', touchAction: 'none' }}
        >
          <GripVertical size={14} />
        </div>
        <div className="pl-5">
          <ChartWidget widget={widget} onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}

interface Props {
  widgets: ChartWidgetType[]
  onReorder: (widgets: ChartWidgetType[]) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export default function ChartWidgetGrid({ widgets, onReorder, onDelete, onAdd }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const sorted = [...widgets].sort((a, b) => a.order - b.order)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sorted.findIndex((w) => w.id === active.id)
    const newIndex = sorted.findIndex((w) => w.id === over.id)
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((w, i) => ({ ...w, order: i }))
    onReorder(reordered)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Charts</p>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Plus size={14} /> Add Chart
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No charts yet</p>
          <p className="text-xs mt-1 mb-3" style={{ color: 'var(--color-text-secondary)' }}>Add a chart widget to visualize your finances</p>
          <Button size="sm" onClick={onAdd}><Plus size={14} /> Add Chart</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {sorted.map((widget) => (
                <SortableWidget key={widget.id} widget={widget} onDelete={() => onDelete(widget.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
