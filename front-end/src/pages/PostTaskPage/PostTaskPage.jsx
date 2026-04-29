import Button from '../../components/ui/Button'
import SectionTitle from '../../components/common/SectionTitle'

function PostTaskPage() {
  return (
    <section className="max-w-2xl space-y-6">
      <SectionTitle title="Post Task" subtitle="Starter form for creating a new task." />
      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="title">
            Task Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="Build dashboard summary"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows="4"
            placeholder="Describe the task details..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>
        <Button type="submit">Save Task</Button>
      </form>
    </section>
  )
}

export default PostTaskPage