import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardHome } from '../constants/routes';

const LoadingScreen = () => (
  <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
    <div className="mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-blue-600" />
    <p className="font-medium text-gray-600 animate-pulse">Checking your session...</p>
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  console.log("role is checked : ", user.role);


  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {

    return <Navigate to={getDashboardHome(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;