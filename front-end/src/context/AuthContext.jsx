import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { onForegroundMessage, requestNotificationPermission } from '../utils/fcm';
import { signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth";
import { auth as firebaseAuth } from "../config/firebase";
import { db } from "../config/firebase"; // Import your initialized Firestore instance
import { doc, onSnapshot, terminate, } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";



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
    city: user.city ?? '',
    location: user.location && Array.isArray(user.location.coordinates)
      ? user.location
      : null,
    skills: Array.isArray(user.skills) ? user.skills : [],
    services: Array.isArray(user.services) ? user.services : [],
    availability: typeof user.availability === 'boolean' ? user.availability : true,
    isVerified: typeof user.isVerified === 'boolean' ? user.isVerified : false,
    hourlyRate: typeof user.hourlyRate === 'number' ? user.hourlyRate : null,
    portfolio: typeof user.portfolio === 'string' ? user.portfolio : '',
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
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false);
  const notificationRequestRef = useRef(false);



  const syncFirebaseAuthentication = async (firebaseToken, mongoUid) => {

    if (!firebaseToken || !mongoUid) return;
    // console.log("sync firebase : ", firebaseToken, mongoUid)

    const currentFirebaseUser = firebaseAuth.currentUser;

    // If already connected as this exact user, skip the handshake overhead
    if (currentFirebaseUser && currentFirebaseUser.uid === mongoUid.toString()) {
      console.log("🔄 Firebase session already active. Skipping re-auth.");
      setIsFirebaseAuthenticated(true);
      return;
    }

    // If user identities swapped, clean up the previous session channel first
    if (currentFirebaseUser && currentFirebaseUser.uid !== mongoUid.toString()) {
      await firebaseSignOut(firebaseAuth);
    }

    try {
      await signInWithCustomToken(firebaseAuth, firebaseToken);
      setIsFirebaseAuthenticated(true);
      console.log("🔒 Frontend securely connected to Firestore.");
    } catch (error) {
      console.error("❌ Firebase custom authentication handshake failed:", error);
    }
  };

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
      // await removeCurrentFcmToken();
      await api.post('/auth/logout');
      await firebaseSignOut(firebaseAuth);

    } catch (error) {
      if (error?.response?.status !== 401) {
        throw error;
      }
    } finally {
      persistUser(null);
      setIsFirebaseAuthenticated(false);
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
        const { data } = await api.get('/auth/verifyMe');
        // console.log('Fetched user data from server:', data);

        if (!mounted) {
          return;
        }

        persistUser(data.user);
        await syncFirebaseAuthentication(data.firebaseToken, data.user.id);

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



  useEffect(() => {
    if (!user?.id || !navigator.onLine) {
      return;
    }

    if (notificationRequestRef.current) {
      return;
    }

    notificationRequestRef.current = true;

    requestNotificationPermission().catch((error) => {
      notificationRequestRef.current = false;
      console.warn("Unable to register push notifications:", error);
    });
  }, [user?.id]);

  useEffect(() => {
    const unsubscribe = onForegroundMessage();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser: persistUser, updateUser, logout, loading, syncFirebaseAuthentication, refreshUser: () => api.get('/auth/me').then(({ data }) => persistUser(data.user)).catch(() => null) }}>
      {/* Do not render children until check is done to avoid "flash" of login page */}
      {!loading ? children :

        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
          {/* Tailwind Spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium animate-pulse">Checking your session...</p>
        </div>
      }
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
