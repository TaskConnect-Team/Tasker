import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

const AUTH_STORAGE_KEY = 'tasker_auth_user';
const LEGACY_TOKEN_KEY = 'token';

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id ?? user._id,
    name: user.name ?? '',
    role: user.role ?? 'customer',
    profileImage: user.profileImage || "https://img.magnific.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_hybrid&w=740&q=80",
    tagline: user.tagline ?? '',
    bio: user.bio ?? '',
    location: user.location ?? user.city ?? '',
    skills: Array.isArray(user.skills) ? user.skills : [],
    services: Array.isArray(user.services) ? user.services : [],
    availability: typeof user.availability === 'boolean' ? user.availability : true,
    isVerified: typeof user.isVerified === 'boolean' ? user.isVerified : false,
    hourlyRate: typeof user.hourlyRate === 'number' ? user.hourlyRate : null,
    portfolio: Array.isArray(user.portfolio) ? user.portfolio : [],
    trustScore: typeof user.trustScore === 'number' ? user.trustScore : 5.0,
  };
};

const readCachedUser = () => {
  try {
    const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawUser) {
      return null;
    }

    return normalizeUser(JSON.parse(rawUser));
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistUser = (nextUser) => {
    const safeUser = normalizeUser(nextUser);

    setUser(safeUser);

    if (safeUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    localStorage.removeItem(LEGACY_TOKEN_KEY);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');

    } catch (error) {
      if (error?.response?.status !== 401) {
        throw error;
      }
    } finally {
      persistUser(null);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  };

  const updateUser = (updates) => {
    if (!updates) {
      return;
    }
    

    persistUser({
      ...user,
      ...updates,
    });
  };

  useEffect(() => {
    localStorage.removeItem(LEGACY_TOKEN_KEY);

    let mounted = true;

    const syncUser = async () => {
      try {
        const { data } = await api.get('/auth/me');

        if (!mounted) {
          return;
        }

        persistUser(data.user);
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error?.response?.status === 401) {
          persistUser(null);
        } else {
          persistUser(readCachedUser());
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const initializeAuth = async () => {
      if (!navigator.onLine) {
        persistUser(readCachedUser());
        setLoading(false);
        return;
      }

      await syncUser();
    };

    const handleOnline = () => {
      syncUser();
    };

    const handleOffline = () => {
      persistUser(readCachedUser());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    initializeAuth();

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };

  }, []); // Run only once on mount


  return (
    <AuthContext.Provider value={{ user, setUser: persistUser, updateUser, logout, loading, refreshUser: () => api.get('/auth/me').then(({ data }) => persistUser(data.user)).catch(() => null) }}>
      {/* Do not render children until check is done to avoid "flash" of login page */}
      {!loading ? children : <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        {/* Tailwind Spinner */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium animate-pulse">Checking your session...</p>
      </div>
      }
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
