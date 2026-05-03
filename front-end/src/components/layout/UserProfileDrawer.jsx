import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Star, Sparkles, ToggleLeft, ToggleRight, LogOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

function UserProfileDrawer({ isOpen, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const profileImage = user?.profileImage
    || 'https://img.magnific.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_hybrid&w=740&q=80';

  const stats = useMemo(
    () => [
      { label: 'Reviews', value: '4.8' },
      { label: 'Impressions', value: '120' },
    ],
    []
  );

  const handleNavigateProfile = () => {
    navigate('/profile');
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    onClose();
  };

  const toggleAvailability = async () => {
    if (!user) {
      return;
    }

    const nextValue = !user.availability;
    setAvailabilityLoading(true);

    try {
      const { data } = await api.put('/users/profile', { availability: nextValue });
      updateUser(data.user);
      toast.success('Availability updated!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close profile drawer"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white px-6 py-8 shadow-xl"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={handleNavigateProfile}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleNavigateProfile();
              }}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300"
            >
              <img
                src={profileImage}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-900">{user?.name ?? 'TaskConnect'}</p>
                <p className="text-sm text-slate-500">{user?.tagline || 'Crafting trusted task matches'}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>{user?.location || 'Remote'}</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase text-white">
                    {user?.role ?? 'member'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 p-4 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-900">
                    <Star className="h-4 w-4 text-slate-900" />
                    {stat.value}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {user?.role === 'tasker' ? (
              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Live Availability</p>
                    <p className="text-xs text-slate-500">Show if you are open to new jobs.</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAvailability}
                    disabled={availabilityLoading}
                    className={`flex items-center gap-2 rounded-full ${user?.availability ? 'bg-slate-900' : 'bg-slate-300'} px-3 py-2 text-xs font-semibold text-white disabled:opacity-60`}
                  >
                    {user?.availability ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    {user?.availability ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-slate-900" />
                <p>Keep your profile current to boost trust and visibility across TaskConnect.</p>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default UserProfileDrawer;
