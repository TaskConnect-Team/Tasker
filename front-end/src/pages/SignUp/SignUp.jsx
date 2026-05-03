import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getDashboardHome } from '../../constants/routes';

export default function SignUp() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [conPassword, setConPassword] = useState('');
  const [showPassword2, setShowPassword2] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user, setUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getDashboardHome(user.role), { replace: true });
    }
  }, [authLoading, navigate, user]);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== conPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    
    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role.toLowerCase(),
        city: city.trim(),
      });

      setUser(data.user);
      toast.success(data.message || 'User registered successfully!');
      navigate(getDashboardHome(data.user.role), { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message || 'Could not connect to the server.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium animate-pulse">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-40px)] bg-gradient-to-br from-indigo-100 via-purple-100 to-violet-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 my-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-indigo-600">Create Account</h1>
          <p className="text-gray-500 mt-2">Join us today and get started 🚀</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <label className="block text-gray-700 font-medium mb-1">Name</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50"
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50"
            type="email"
            name="email"
            id="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="role" className="block text-gray-700 font-medium mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50 text-gray-700 appearance-none cursor-pointer"
          >
            <option value="" disabled>Select a role...</option>
            <option value="Tasker">Tasker</option>
            <option value="Customer">Customer</option>
          </select>

          <label className="block text-gray-700 font-medium mb-1">City</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50"
            type="text"
            name="city"
            id="city"
            placeholder="Enter your city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />

          <label className="block text-gray-700 font-medium mb-1">Password</label>

          <div className="relative w-full max-w-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50"
              placeholder="********"
              name="password"
              id="password"
              autoComplete="new-password"
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

          <label className="block text-gray-700 font-medium mb-1">Confirm Password</label>

          <div className="relative w-full max-w-sm">
            <input
              type={showPassword2 ? 'text' : 'password'}
              className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none transition bg-gray-50"
              name="new-password"
              id="password2"
              autoComplete="new-password"
              placeholder="********"
              value={conPassword}
              onChange={(e) => {
                setConPassword(e.target.value);
                e.target.setCustomValidity(e.target.value !== password ? 'Passwords do not match' : '');
              }}
              required
            />

            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-600 hover:text-indigo-500"
              onClick={() => setShowPassword2(!showPassword2)}
              aria-label={showPassword2 ? 'Hide password' : 'Show password'}
            >
              {showPassword2 ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg bg-indigo-500 text-white font-semibold shadow-md hover:bg-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <p className="text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-500 font-medium hover:text-indigo-700 transition"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}