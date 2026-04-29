import Button from '../../components/ui/Button'
import SectionTitle from '../../components/common/SectionTitle'

function DashboardPage() {
  return (
    <section className="space-y-6">
      <SectionTitle
        title="Dashboard"
        subtitle="Overview of your task workflow, status, and activity."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Open Tasks', value: '24' },
          { label: 'Completed', value: '18' },
          { label: 'Pending Review', value: '6' },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Quick action</h2>
            <p className="text-sm text-slate-600">Create a task post from the starter route.</p>
          </div>
          <Button>Post Task</Button>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage