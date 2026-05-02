export const ROUTES = {
  login: '/login',
  signup: '/signup',
  home: '/',
  requests: '/requests',
  postTask: '/post-task',
  messages: '/messages',
  profile: '/profile',
  map: '/map',
  activeJobs: '/active-jobs',
  earnings: '/dashboard',
  settings: '/settings',
  privacy: '/privacy',
};

export const getDashboardHome = (role) => (
  ROUTES.home
);