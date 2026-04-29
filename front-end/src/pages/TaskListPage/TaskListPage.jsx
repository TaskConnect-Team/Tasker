import SectionTitle from '../../components/common/SectionTitle'

const tasks = [
  { id: 'T-1001', title: 'Design landing page', status: 'In progress' },
  { id: 'T-1002', title: 'Wire up auth flow', status: 'Open' },
  { id: 'T-1003', title: 'Review payment UI', status: 'Completed' },
]

function TaskListPage() {
  return (
    <section className="space-y-6">
      <SectionTitle title="Task List" subtitle="A simple starter list for managing active work." />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-medium">Task ID</th>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-slate-100">
                <td className="px-6 py-4 font-medium text-slate-900">{task.id}</td>
                <td className="px-6 py-4 text-slate-700">{task.title}</td>
                <td className="px-6 py-4 text-slate-600">{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default TaskListPage