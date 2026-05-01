import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import logo from '/logo.png'; 
import { useAuth } from '../../context/AuthContext'

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isTasker = user?.role === 'tasker';
  const dashboardRoute = isTasker ? ROUTES.taskerDashboard : ROUTES.customerDashboard;
  const secondaryRoute = isTasker ? ROUTES.taskerTaskList : ROUTES.customerPostTask;
  const secondaryLabel = isTasker ? 'Task List' : 'Post Task';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-950 text-white lg:border-b-0 lg:border-r lg:border-slate-800">
        <div className="flex h-full flex-col p-6">
          <Link to={ROUTES.dashboard} className="text-lg font-semibold tracking-tight">
            TaskConnect
          </Link>
          <nav className="mt-10 space-y-2 text-sm font-medium">
            <NavLink
              to={dashboardRoute}
              end
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to={secondaryRoute}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              {secondaryLabel}
            </NavLink>
          </nav>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <img className="h-8 w-8" src={logo} alt="logo" />
            <div>
              <p className="text-sm font-medium text-slate-500">Workspace</p>
              <h1 className="text-lg font-semibold tracking-tight">Task Management Starter</h1>
              {user ? <p className="text-sm text-slate-500">{user.name} · {user.role}</p> : null}
            </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Log out
              </button>
              <div aria-hidden="true">
                <img src="https://i.ibb.co/V7k0fmR/demo-1.jpg"
                 alt="demo pic" border="0" 
                 className="h-10 w-10 rounded-full bg-slate-200 object-cover"
                 />
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell