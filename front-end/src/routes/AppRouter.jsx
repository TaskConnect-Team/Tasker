import { Navigate, Route, Routes } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import CustomerDashboardPage from '../pages/CustomerDashboardPage/DashboardPage'
import PostTaskPage from '../pages/PostTaskPage/PostTaskPage'
import TaskListPage from '../pages/TaskListPage/TaskListPage'
import NotFound from '../pages/NotFound/NotFound'
import Login from '../pages/LogIn/LogIn'
import Signup from '../pages/SignUp/SignUp'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute, { RoleRoute } from './PrivateRoute'
import { getDashboardHome } from '../constants/routes'
import { useAuth } from '../context/AuthContext'

const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardHome(user.role)} replace />;
};




function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<AppShell />}>
            <Route index element={<DashboardRedirect />} />

            <Route element={<RoleRoute allowedRoles={['customer']} />}>
              <Route path="customer" element={<CustomerDashboardPage />} />
              <Route path="customer/tasks/new" element={<PostTaskPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['tasker']} />}>
              <Route path="tasker" element={<TaskListPage />} />
              <Route path="tasker/tasks" element={<TaskListPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter