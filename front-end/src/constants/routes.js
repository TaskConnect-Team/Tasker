export const ROUTES = {
  login: '/login',
  signup: '/signup',
  home: '/',
  customerDashboard: '/customerDashboard',
  requests: '/requests',
  postTask: '/post-task',
  messages: '/messages',
  profile: '/profile',
  map: '/map',
  activeJobs: '/active-jobs',
  earnings: '/earnings',
  settings: '/settings',
  privacy: '/privacy',
};

export const getDashboardHome = (role) => (
  ROUTES.home
);