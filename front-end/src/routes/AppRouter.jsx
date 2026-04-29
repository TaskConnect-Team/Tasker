import { Navigate, Route, Routes } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import DashboardPage from '../pages/DashboardPage/DashboardPage'
import PostTaskPage from '../pages/PostTaskPage/PostTaskPage'
import TaskListPage from '../pages/TaskListPage/TaskListPage'
import NotFound from '../pages/NotFound/NotFound'
import Login from '../pages/LogIn/LogIn'
import Signup from '../pages/SignUp/SignUp'
import { Toaster } from 'react-hot-toast'




function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/new" element={<PostTaskPage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter