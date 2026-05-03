import { Navigate, Route, Routes } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import CustomerDashboardPage from '../pages/CustomerDashboardPage/DashboardPage'
import PostTaskPage from '../pages/PostTaskPage/PostTaskPage'
import TaskListPage from '../pages/TaskListPage/TaskListPage'
import MessagesPage from '../pages/MessagesPage/MessagesPage'
import ProfilePage from '../pages/ProfilePage/ProfilePage'
import MapPage from '../pages/MapPage/MapPage'
import ActiveJobsPage from '../pages/ActiveJobsPage/ActiveJobsPage'
import EarningsPage from '../pages/EarningsPage/EarningsPage'
import SettingsPage from '../pages/SettingsPage/SettingsPage'
import PrivacyPage from '../pages/PrivacyPage/PrivacyPage'
import NotFound from '../pages/NotFound/NotFound'
import Login from '../pages/LogIn/LogIn'
import Signup from '../pages/SignUp/SignUp'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute, { RoleRoute } from './PrivateRoute'
import { useAuth } from '../context/AuthContext'

const HomeByRole = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'tasker') {
    return <TaskListPage />;
  }

  return <CustomerDashboardPage />;
};




function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomeByRole />} />

            <Route element={<RoleRoute allowedRoles={['customer']} />}>
              <Route path="requests" element={<TaskListPage />} />
              <Route path="post-task" element={<PostTaskPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['tasker', 'customer']} />}>
              <Route path="map" element={<MapPage />} />
              <Route path="active-jobs" element={<ActiveJobsPage />} />
              <Route path="dashboard" element={<EarningsPage />} />
            </Route>

            <Route path="messages" element={<MessagesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter