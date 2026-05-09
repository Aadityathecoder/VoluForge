export function DashboardSection({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="card p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-50">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}
