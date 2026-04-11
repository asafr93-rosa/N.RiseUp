import { useState } from 'react'
import toast from 'react-hot-toast'
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
import { GripVertical } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import NetWorthHeader from '../components/home/NetWorthHeader'
import SpendingInsights from '../components/home/SpendingInsights'
import MonthlyComparisonChart from '../components/home/MonthlyComparisonChart'
import ChartWidgetGrid from '../components/home/ChartWidgetGrid'
import AddChartModal from '../components/home/AddChartModal'

interface SortableSectionProps {
  id: string
  children: React.ReactNode
}

function SortableSection({ id, children }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="relative">
        <div
          {...attributes}
          {...listeners}
          className="absolute right-0 top-0 z-10 cursor-grab active:cursor-grabbing p-2 rounded"
          style={{ color: 'var(--color-text-secondary)', touchAction: 'none' }}
        >
          <GripVertical size={14} />
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Home() {
  const addChartWidget = useFinanceStore((s) => s.addChartWidget)
  const deleteChartWidget = useFinanceStore((s) => s.deleteChartWidget)
  const reorderChartWidgets = useFinanceStore((s) => s.reorderChartWidgets)
  const chartWidgets = useFinanceStore((s) => s.chartWidgets)
  const dashboardSectionOrder = useFinanceStore((s) => s.dashboardSectionOrder)
  const reorderDashboardSections = useFinanceStore((s) => s.reorderDashboardSections)

  const [addChartOpen, setAddChartOpen] = useState(false)
  const [month, setMonth] = useState(new Date())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = dashboardSectionOrder.indexOf(String(active.id))
    const newIndex = dashboardSectionOrder.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    reorderDashboardSections(arrayMove(dashboardSectionOrder, oldIndex, newIndex))
  }

  const sections: Record<string, React.ReactNode> = {
    monthly: <MonthlyComparisonChart />,
    spending: <SpendingInsights month={month} onMonthChange={setMonth} />,
    charts: (
      <ChartWidgetGrid
        widgets={chartWidgets}
        onReorder={reorderChartWidgets}
        onDelete={(id) => { deleteChartWidget(id); toast.success('Widget removed') }}
        onAdd={() => setAddChartOpen(true)}
        selectedMonth={month}
      />
    ),
  }

  // Ensure all known section ids are present (guard against stale persisted state)
  const orderedIds = dashboardSectionOrder.filter((id) => id in sections)

  return (
    <div className="p-4 pb-6">
      <NetWorthHeader />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {orderedIds.map((id) => (
              <SortableSection key={id} id={id}>
                {sections[id]}
              </SortableSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <AddChartModal
        open={addChartOpen}
        onClose={() => setAddChartOpen(false)}
        onAdd={(data) => { addChartWidget(data); toast.success('Chart widget added') }}
      />
    </div>
  )
}
