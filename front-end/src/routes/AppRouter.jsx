import { Navigate, Route, Routes } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import CustomerDashboardPage from '../pages/CustomerDashboardPage/DashboardPage'
import PostTaskPage from '../pages/PostTaskPage/PostTaskPage'
import TaskListPage from '../pages/TaskListPage/TaskListPage'
import BrowseTasksPage from '../pages/BrowseTasksPage/BrowseTasksPage'
import BrowseTaskersPage from '../pages/BrowseTaskersPage/BrowseTaskersPage'
import TaskDetailsPage from '../pages/TaskDetailsPage/TaskDetailsPage'
import MessagesPage from '../pages/MessagesPage/MessagesPage'
import ProfilePage from '../pages/ProfilePage/ProfilePage'
import PublicProfilePage from '../pages/ProfilePage/PublicProfilePage'
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

        {/* public route accessable for all user */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile/:userId" element={<PublicProfilePage />} />



        <Route element={<ProtectedRoute />}>
          {/* protected routes that are only accessable for logged in user */}

          <Route path="browse-tasks" element={<BrowseTasksPage />} />
          <Route path="browse-tasker" element={<BrowseTaskersPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailsPage />} />

          <Route path="/" element={<Layout />}>
            {/* pages that inside layout are protected by auth and accessable for both customer and tasker but some of them are role based accessable */}

            {/*  default home page || Index Route handles the role-based redirection for '/' */}
            <Route index element={<HomeByRole />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />

            <Route element={<RoleRoute allowedRoles={['customer']} />}>
              {/* pages that only accessable for customer inside layout  */}
              <Route path="customerDashboard" element={<CustomerDashboardPage />} />
              <Route path="requests" element={<TaskListPage />} />
              <Route path="post-task" element={<PostTaskPage />} />

            </Route>

            <Route element={<RoleRoute allowedRoles={['tasker']} />}>
              {/* pages that only accessable for tasker inside layout  */}
              <Route path="map" element={<MapPage />} />
              <Route path="active-jobs" element={<ActiveJobsPage />} />
              <Route path="earnings" element={<EarningsPage />} />
              
            </Route>
          </Route>


        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter