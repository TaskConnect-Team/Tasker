export const ROUTES = {
  login: '/login',
  signup: '/signup',
  home: '/',
  customerDashboard: '/customer-dashboard',
  taskerDashboard: '/tasker-dashboard',
  requests: '/requests',
  orders: '/orders',
  postTask: '/post-task',
  notifications: '/notifications',
  profile: '/profile',
  map: '/map',
  activeJobs: '/active-jobs',
  earnings: '/earnings',
  settings: '/settings',
  privacy: '/privacy',
};

export const getDashboardHome = (role) => (
  role === 'tasker' ? ROUTES.taskerDashboard : ROUTES.customerDashboard
);
