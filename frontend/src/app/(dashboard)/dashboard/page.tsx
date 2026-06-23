import { PageHeader } from '@/components/shared/PageHeader'
import { LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="px-6 py-6 max-w-[var(--content-max)] mx-auto">
      <PageHeader
        title="Dashboard"
        description="Your productivity at a glance."
        icon={<LayoutDashboard />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] animate-skeleton"
          />
        ))}
      </div>
    </div>
  )
}
