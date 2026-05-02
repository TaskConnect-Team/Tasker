import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Briefcase,
  Compass,
  FileText,
  Inbox,
  MapPin,
  PlusCircle,
  User,
  Activity,
  BarChart3,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const role = user?.role ?? 'customer';

  const mainNavItems = useMemo(() => {
    if (role === 'tasker') {
      return [
        { label: 'Job Feed', to: ROUTES.home, icon: Briefcase },
        { label: 'Map View', to: ROUTES.map, icon: MapPin },
        { label: 'Current Work', to: ROUTES.activeJobs, icon: Activity },
        { label: 'Inbox', to: ROUTES.messages, icon: Inbox },
        { label: 'Dashboard', to: ROUTES.earnings, icon: BarChart3 },
      ];
    }

    return [
      { label: 'Explore', to: ROUTES.home, icon: Compass },
      { label: 'My Tasks', to: ROUTES.requests, icon: FileText },
      { label: 'Post Task', to: ROUTES.postTask, icon: PlusCircle },
      { label: 'Inbox', to: ROUTES.messages, icon: Inbox },
      { label: 'Account', to: ROUTES.profile, icon: User },
    ];
  }, [role]);

  const moreNavItems = useMemo(
    () => [
      { label: 'Settings', to: ROUTES.settings, icon: Settings },
      { label: 'Privacy', to: ROUTES.privacy, icon: Shield },
      { label: 'Logout', to: ROUTES.login, icon: LogOut, action: 'logout' },
    ],
    []
  );

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopBar onOpenSidebar={openSidebar} />
      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          mainItems={mainNavItems}
          moreItems={moreNavItems}
        />
        <main className="min-h-[calc(100vh-64px)] flex-1 px-4 pb-24 pt-20 md:px-8 md:pb-10 md:pt-24">
          <Outlet />
        </main>
      </div>
      <BottomNav items={mainNavItems} />
    </div>
  );
}

export default Layout;
