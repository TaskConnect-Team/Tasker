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
import ProtectedRoute from './PrivateRoute'




function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />


        {/* Tasker Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['tasker']} />}>
          <Route element={<AppShell />} >
            <Route path="/tasks" element={<TaskListPage />} />
            {/* Add tasker-specific routes here */}

            
          </Route>
        </Route>

        {/* Customer Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>

          <Route element={<AppShell />} >
            <Route path="/CustomerDashboard" element={<CustomerDashboardPage />} />
            <Route path="/tasks/new" element={<PostTaskPage />} />
            {/* Add customer-specific routes here */}

          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter