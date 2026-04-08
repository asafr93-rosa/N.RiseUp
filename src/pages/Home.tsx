import { useState } from 'react'
import toast from 'react-hot-toast'
import { useFinanceStore } from '../store/useFinanceStore'
import NetWorthHeader from '../components/home/NetWorthHeader'
import SpendingInsights from '../components/home/SpendingInsights'
import ChartWidgetGrid from '../components/home/ChartWidgetGrid'
import AddChartModal from '../components/home/AddChartModal'

export default function Home() {
  const addChartWidget = useFinanceStore((s) => s.addChartWidget)
  const deleteChartWidget = useFinanceStore((s) => s.deleteChartWidget)
  const reorderChartWidgets = useFinanceStore((s) => s.reorderChartWidgets)
  const chartWidgets = useFinanceStore((s) => s.chartWidgets)

  const [addChartOpen, setAddChartOpen] = useState(false)

  return (
    <div className="p-4 pb-6">
      <NetWorthHeader />
      <SpendingInsights />
      <ChartWidgetGrid
        widgets={chartWidgets}
        onReorder={reorderChartWidgets}
        onDelete={(id) => { deleteChartWidget(id); toast.success('Widget removed') }}
        onAdd={() => setAddChartOpen(true)}
      />
      <AddChartModal
        open={addChartOpen}
        onClose={() => setAddChartOpen(false)}
        onAdd={(data) => { addChartWidget(data); toast.success('Chart widget added') }}
      />
    </div>
  )
}
