import { Link, Outlet } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to={ROUTES.home} className="text-xl font-semibold tracking-tight">
            Tasker
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link to={ROUTES.home} className="hover:text-slate-600">
              Home
            </Link>
            <Link to={ROUTES.login} className="hover:text-slate-600">
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell