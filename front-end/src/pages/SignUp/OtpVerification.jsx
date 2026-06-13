import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getDashboardHome } from '../../constants/routes';

const AUTH_TOKEN_KEY = 'taskconnect_jwt';

export default function OtpVerification({ email, onBack }) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleVerify = async (event) => {
    event.preventDefault();

    if (otp.trim().length !== 6) {
      toast.error('Enter the 6-digit code.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post('/auth/verify-otp', {
        email,
        otp: otp.trim(),
      });

      setVerified(true);
      setUser(data.user);

      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      }

      toast.success('Account Verified!');

      setTimeout(() => {
        navigate(getDashboardHome(data.user.role), { replace: true });
      }, 650);
    } catch (error) {
      const message = error?.response?.data?.message || 'Could not verify the code.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-40px)] items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-950">
            {verified ? 'Account Verified!' : 'Check your email'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {verified
              ? 'Taking you to your dashboard now.'
              : `Enter the 6-digit code sent to ${email}.`}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="otp" className="mb-1 block text-sm font-medium text-slate-700">Verification code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-center text-2xl font-semibold tracking-[0.35em] text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || verified}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Verifying...' : 'Verify account'}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          disabled={submitting || verified}
          className="mt-4 w-full rounded-md border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Use a different email
        </button>
      </section>
    </main>
  );
}
