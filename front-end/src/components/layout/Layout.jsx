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
import UserProfileDrawer from './UserProfileDrawer';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useAuth();

  const role = user?.role ?? 'customer';

  const mainNavItems = useMemo(() => {
    if (role === 'tasker') {
      return [
        { label: 'Job Feed', to: ROUTES.home, icon: Briefcase },
        { label: 'Orders', to: ROUTES.orders, icon: Inbox },
        { label: 'Map View', to: ROUTES.map, icon: MapPin },
        { label: 'Notifications', to: ROUTES.notifications, icon: FileText },
        { label: 'Earning', to: ROUTES.earnings, icon: BarChart3 },
      ];
    }

    return [
      { label: 'Dashboard', to: ROUTES.home, icon: Compass },
      { label: 'My Tasks', to: ROUTES.orders, icon: Inbox },
      { label: 'Post Task', to: ROUTES.postTask, icon: PlusCircle },
      { label: 'Notifications', to: ROUTES.notifications, icon: FileText  },
      { label: 'Account', to: ROUTES.profile, icon: User },
    ];
  }, [role]);

  const moreNavItems = useMemo(
    () => [
      { label: 'Settings', to: ROUTES.settings, icon: Settings },
      { label: 'Privacy', to: ROUTES.privacy, icon: Shield },
    ],
    []
  );

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openProfile = () => setIsProfileOpen(true);
  const closeProfile = () => setIsProfileOpen(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopBar onOpenSidebar={openSidebar} onAvatarClick={openProfile} />
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
      <UserProfileDrawer isOpen={isProfileOpen} onClose={closeProfile} />
    </div>
  );
}

export default Layout;
