import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeCheck, MapPin, Mail, DollarSign } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_IMAGE =
  'https://img.magnific.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_hybrid&w=740&q=80';

function PublicProfilePage() {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwner = authUser?.id === userId;

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/users/${userId}`);
        if (mounted) {
          setProfile(data.user);
        }
      } catch (error) {
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const skills = useMemo(() => profile?.skills || [], [profile]);
  const portfolio = useMemo(() => profile?.portfolio || [], [profile]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profile.profileImage || DEFAULT_IMAGE}
              alt="Profile"
              className="h-20 w-20 rounded-full object-cover"
            />
            <div>
              <p className="text-2xl font-semibold text-slate-900">{profile.name}</p>
              <p className="text-sm text-slate-500">{profile.tagline || 'TaskConnect member'}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-4 w-4" />
                <span>{profile.location || 'Remote'}</span>
                {!profile.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase text-white">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {!isOwner ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <Mail className="h-4 w-4" />
              Contact
            </button>
          ) : null}
        </div>
        <div className="mt-4 text-xs text-slate-500">Member since {profile.memberSince || '—'}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">About</h2>
        <p className="mt-2 text-sm text-slate-600">
          {profile.bio || 'This member has not added a bio yet.'}
        </p>
      </section>

      {profile.role === 'tasker' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Skills Cloud</h2>
            <div className="flex items-center gap-2 text-sm text-slate-900">
              <DollarSign className="h-4 w-4" />
              <span>{profile.hourlyRate ? `$${profile.hourlyRate}/hr` : 'Rate not set'}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.length ? (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No skills listed yet.</p>
            )}
          </div>
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">Portfolio</h3>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {portfolio.length ? (
                portfolio.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 p-3 text-xs text-slate-600 hover:border-slate-300"
                  >
                    {link}
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">No portfolio links yet.</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Hiring Stats</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Tasks Posted</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">—</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Trust Score</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.trustScore}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default PublicProfilePage;
