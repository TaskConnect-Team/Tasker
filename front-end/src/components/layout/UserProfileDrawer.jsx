import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Star, Sparkles, ToggleLeft, ToggleRight, LogOut, Pencil, X, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

function UserProfileDrawer({ isOpen, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [logouting, setLogouting] = useState(false);

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
    setLogouting(true);
    await logout();
    navigate('/login', { replace: true });
    onClose();
    setLogouting(false);
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

            <button
              onClick={onClose}
              className="absolute top-2 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-300  bg-slate-200 cursor-pointer transition-all duration-200 group"
              aria-label="Close Drawer"
            >
              <X
                size={20}
                className="text-black  hover:rotate-180 transition-all duration-500"
              />
            </button>


            <div
              className="flex items-center gap-4 rounded-2xl border mt-4 border-slate-200 p-4 transition hover:border-slate-300"
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
                  <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] uppercase text-white">
                    {user?.role ?? 'member'}
                  </span>
                </div>
              </div>

              {/* <button
              tabIndex={0}
              onClick={handleNavigateProfile}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleNavigateProfile();
              }}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded"
            >
              View Profile
            </button> */}

              <button
                type="button"
                onClick={handleNavigateProfile}
                className="rounded-full border border-slate-200 p-2 text-slate-600 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>



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
                    className={`flex hover:scale-105 items-center gap-2 rounded-full ${user?.availability ? 'bg-indigo-500' : 'bg-slate-300'} px-3 py-2 text-xs font-semibold text-white disabled:opacity-60`}
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

            <div className="mt-auto pt-6 ">
              <button
                type="button"
                onClick={handleLogout}
                disabled={logouting}
                className="w-full cursor-pointer flex items-center justify-center py-2 rounded-lg bg-indigo-500 text-white font-semibold shadow-md hover:bg-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <LogOut className="h-4 w-4" />
                {logouting ? '...' : 'Logout'}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default UserProfileDrawer;
