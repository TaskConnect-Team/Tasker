import { Link, NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import logo from '/logo.png'; 

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-950 text-white lg:border-b-0 lg:border-r lg:border-slate-800">
        <div className="flex h-full flex-col p-6">
          <Link to={ROUTES.dashboard} className="text-lg font-semibold tracking-tight">
            TaskConnect
          </Link>
          <nav className="mt-10 space-y-2 text-sm font-medium">
            <NavLink
              to={ROUTES.dashboard}
              end
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to={ROUTES.taskList}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              Task List
            </NavLink>
            <NavLink
              to={ROUTES.postTask}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              Post Task
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
            </div>
            </div>

            <div  aria-hidden="true">
              <img src="https://i.ibb.co/V7k0fmR/demo-1.jpg"
               alt="demo pic" border="0" 
               className="h-10 w-10 rounded-full bg-slate-200 object-cover"
               />
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