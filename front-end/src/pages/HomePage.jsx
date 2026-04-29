import SectionTitle from '../components/common/SectionTitle'
import Button from '../components/ui/Button'

function HomePage() {
  return (
    <section>
      <SectionTitle
        title="Welcome to Tasker"
        subtitle="A clean Vite + React baseline with scalable folders and reusable UI."
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-slate-700">Start building your pages, features, and services from this structure.</p>
        <Button>Primary Action</Button>
      </div>
    </section>
  )
}

export default HomePage