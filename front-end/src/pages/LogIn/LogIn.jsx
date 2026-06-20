import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getDashboardHome } from '../../constants/routes';

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { user, setUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getDashboardHome(user.role), { replace: true });
    }
  }, [authLoading, navigate, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      setUser(data.user);
      toast.success(data.message || 'Login successful!');
      navigate(getDashboardHome(data.user.role), { replace: true });
    }
    catch (error) {
      const message = error?.response?.data?.message || 'Could not connect to the server.';
      toast.error(message);

    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();

    toast.error('Google login is not implemented yet.');
    // 1. Google login logic here
    // navigate("/dashboard");
  }


  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium animate-pulse">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center pt-2 items-center min-h-[calc(100vh-40px)] bg-gradient-to-br from-indigo-100 via-purple-100 to-violet-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-extrabold text-indigo-600">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Please log in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 ">
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-1">Password</label>

          <div className="relative w-full max-w-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50"
              placeholder="********"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-600 hover:text-indigo-500"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg bg-indigo-500 text-white font-semibold shadow-md hover:bg-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 px-6 py-3 text-gray-700 font-medium border border-gray-300 rounded-lg bg-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-95"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Continue with Google</span>
          </button>

        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don’t have an account?{' '}
          <Link
            to="/signup"
            className="text-indigo-500 font-medium hover:text-indigo-700 transition"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}