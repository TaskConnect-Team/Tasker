import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="mx-auto mt-16 max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you requested does not exist.</p>
      <Link to="/" className="mt-5 inline-flex text-sm font-semibold text-slate-900 hover:text-slate-700">
        Back to home
      </Link>
    </section>
  )
}

export default NotFoundPage