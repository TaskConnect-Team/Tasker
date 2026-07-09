import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getDashboardHome } from '../../constants/routes';
import OtpVerification from './OtpVerification';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const isLengthValid = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const isPasswordValid = isLengthValid && hasUppercase && hasNumber;

  const passwordRules = [
    { label: 'More than 8 characters', isValid: isLengthValid },
    { label: 'At least one uppercase letter', isValid: hasUppercase },
    { label: 'At least one number', isValid: hasNumber },
  ];

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getDashboardHome(user.role), { replace: true });
    }
  }, [authLoading, navigate, user]);

  const updateField = (field) => (event) => {
    if (field === 'password' && passwordError) {
      setPasswordError('');
    }

    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!isPasswordValid) {
      setPasswordError('Password does not meet the requirements.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      };

      const { data } = await api.post('/auth/signup', payload);

      setOtpEmail(payload.email);
      toast.success(data.message || 'Verification code sent to your email.');
    } catch (error) {
      const message = error?.response?.data?.message || 'Could not create your account.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-blue-600" />
        <p className="font-medium text-gray-600 animate-pulse">Checking your session...</p>
      </div>
    );
  }

  if (otpEmail) {
    return (
      <OtpVerification
        email={otpEmail}
        onBack={() => setOtpEmail('')}
      />
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-40px)] items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-indigo-600">Create your account</h1>
          <p className="text-gray-500 mt-2">Start with the essentials. Email verification next.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={updateField('name')}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Ayesha Khan"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={formData.email}
              onChange={updateField('email')}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={updateField('password')}
                required
                minLength={8}
                aria-describedby="password-rules password-error"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-11 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-blue-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            <ul id="password-rules" className="mt-3 space-y-1.5">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-sm ${
                    rule.isValid ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      rule.isValid
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    {rule.isValid ? '✓' : '×'}
                  </span>
                  {rule.label}
                </li>
              ))}
            </ul>
            {passwordError && (
              <p id="password-error" className="mt-2 text-sm font-medium text-red-600">
                {passwordError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={updateField('role')}
              className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="customer">Customer</option>
              <option value="tasker">Tasker</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || !isPasswordValid}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Sending code...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
