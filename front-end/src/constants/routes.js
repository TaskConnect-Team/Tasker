export const ROUTES = {
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  customerDashboard: '/dashboard/customer',
  customerPostTask: '/dashboard/customer/tasks/new',
  taskerDashboard: '/dashboard/tasker',
  taskerTaskList: '/dashboard/tasker/tasks',
  taskList: '/dashboard/tasker/tasks',
  postTask: '/dashboard/customer/tasks/new',
};

export const getDashboardHome = (role) => (
  role === 'tasker' ? ROUTES.taskerDashboard : ROUTES.customerDashboard
);