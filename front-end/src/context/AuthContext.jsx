import React, { createContext, useContext, useState, useEffect, use } from 'react';
// import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/auth/me", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to verify user");
        const data = await res.json();

        setUser(data.user || null);
        console.log("user set to:", data.user);

      } catch (err) {

        console.log("error verifying user:", err);
        localStorage.removeItem('token');
        setUser(null); 
        // Not logged in or session expired
      } finally {
        setLoading(false); // Authentication check is complete
      }
    };


    verifyUser();

  }, []); // Run only once on mount


  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
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
