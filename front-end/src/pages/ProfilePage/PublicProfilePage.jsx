// frontend/src/pages/PublicProfilePage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  MapPin,
  DollarSign,
  Star,
  Calendar,
  Briefcase,
  Award,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  ChevronLeft,
  Link2,
  Mail,
  Phone,
  Globe,
  Shield,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_IMAGE =
  'https://img.magnific.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_hybrid&w=740&q=80';

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

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
          toast.error(error?.response?.data?.message || 'Failed to load profile');
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
  const services = useMemo(() => profile?.services || [], [profile]);
  const portfolio = useMemo(() => profile?.portfolio || '', [profile]);
  const isTasker = profile?.role === 'tasker';
  const isOwnProfile = user?.id === userId;
  const ratingValue = profile?.averageRating || 0;
  const reviewCount = profile?.totalReviews || 0;

  // AI Insights - Generate from profile data
  const aiInsights = useMemo(() => {
    if (!profile) return null;

    const insights = [];
    if (isTasker) {
      if (skills.length >= 5) {
        insights.push({ icon: <Award className="h-4 w-4" />, text: 'Multi-skilled professional' });
      }
      if (profile.isVerified) {
        insights.push({ icon: <Shield className="h-4 w-4" />, text: 'Verified tasker' });
      }
      if (profile.trustScore >= 8) {
        insights.push({ icon: <ThumbsUp className="h-4 w-4" />, text: 'Highly trusted' });
      }
      if (reviewCount >= 10) {
        insights.push({ icon: <Users className="h-4 w-4" />, text: `${reviewCount}+ reviews` });
      }
      if (profile.availability) {
        insights.push({ icon: <Clock className="h-4 w-4" />, text: 'Available now' });
      }
    }
    return insights;
  }, [profile, isTasker, skills.length, reviewCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                <p className="text-sm text-slate-500">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-slate-100 p-4">
                <Users className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Profile Not Found</h3>
              <p className="text-sm text-slate-500">
                The user you're looking for doesn't exist or has been removed.
              </p>
              <Button variant="primary" className="mt-2" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Profile Header */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-5">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={profile.profileImage || DEFAULT_IMAGE}
                      alt={profile.name}
                      className="h-24 w-24 rounded-2xl object-cover shadow-sm ring-2 ring-slate-100 lg:h-28 lg:w-28"
                    />
                    {profile.isVerified && (
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-white shadow-sm">
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                    )}
                    {profile.availability && isTasker && (
                      <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
                        ●
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                      {isTasker && profile.availability && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {profile.tagline || (isTasker ? 'Professional Tasker' : 'TaskConnect Member')}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.city || profile.location || 'Location not set'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                      {isTasker && profile.hourlyRate && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          PKR {profile.hourlyRate}/hr
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!isOwnProfile && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/messages/${userId}`)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate('/settings/profile')}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(ratingValue)
                            ? 'fill-amber-400 text-amber-400'
                            : i < Math.ceil(ratingValue)
                              ? 'fill-amber-400/50 text-amber-400/50'
                              : 'fill-slate-200 text-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {ratingValue.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400">({reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Briefcase className="h-4 w-4" />
                  <span>
                    {isTasker
                      ? `${profile.tasksCompleted || 0} tasks completed`
                      : `${profile.tasksPosted || 0} tasks posted`}
                  </span>
                </div>
                {isTasker && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>Trust Score: {profile.trustScore || 5}/10</span>
                  </div>
                )}
              </div>
            </motion.section>

            {/* AI Insights */}
            {aiInsights && aiInsights.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6 shadow-sm lg:p-8"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-indigo-900">AI Insights</h3>
                  <span className="ml-auto text-xs text-indigo-400">Powered by Gemini</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {aiInsights.map((insight, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm"
                    >
                      {insight.icon}
                      {insight.text}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Tabs */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'about'
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  About
                  {activeTab === 'about' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
                {isTasker && (
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'skills'
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Skills & Services
                    {activeTab === 'skills' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                )}
                {isTasker && portfolio && (
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'portfolio'
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Portfolio
                    {activeTab === 'portfolio' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                )}
                {!isTasker && (
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'stats'
                        ? 'text-indigo-600'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Stats
                    {activeTab === 'stats' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                )}
              </div>

              <div className="p-6 lg:p-8">
                {/* About Tab */}
                {activeTab === 'about' && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      About {profile.name}
                    </h3>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {profile.bio || 'This member has not added a bio yet.'}
                    </div>
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && isTasker && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Skills
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No skills listed yet.</p>
                      )}
                    </div>

                    {services.length > 0 && (
                      <>
                        <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
                          Services Offered
                        </h4>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {services.map((service) => (
                            <span
                              key={service}
                              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && isTasker && portfolio && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Portfolio
                    </h3>
                    <div className="mt-4">
                      <a
                        href={portfolio.startsWith('http://') || portfolio.startsWith('https://') ? portfolio : `https://${portfolio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:border-indigo-200"
                      >
                        <Link2 className="h-4 w-4" />
                        {portfolio.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        <span className="text-xs text-slate-400">↗</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && !isTasker && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Hiring Activity
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <p className="text-xs text-slate-500">Tasks Posted</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {profile.tasksPosted || 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <p className="text-xs text-slate-500">Trust Score</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {profile.trustScore || '—'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:col-span-2">
                        <p className="text-xs text-slate-500">Member Since</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {new Date(profile.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Quick Info
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Role</p>
                    <p className="font-medium text-slate-700 capitalize">{profile.role}</p>
                  </div>
                </div>
                {isTasker && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Hourly Rate</p>
                      <p className="font-medium text-slate-700">
                        {profile.hourlyRate ? `PKR ${profile.hourlyRate}/hr` : 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="font-medium text-slate-700">
                      {profile.city || profile.location || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Joined</p>
                    <p className="font-medium text-slate-700">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Trust & Verification */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Trust & Verification
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <span className="text-sm text-slate-600">Verified Account</span>
                  <span
                    className={`text-sm font-medium ${profile.isVerified ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                  >
                    {profile.isVerified ? '✅ Yes' : '—'}
                  </span>
                </div>
                {isTasker && (
                  <>
                    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                      <span className="text-sm text-slate-600">Trust Score</span>
                      <span className="text-sm font-medium text-slate-700">
                        {profile.trustScore || 5}/10
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                      <span className="text-sm text-slate-600">Tasks Completed</span>
                      <span className="text-sm font-medium text-slate-700">
                        {profile.tasksCompleted || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                      <span className="text-sm text-slate-600">Total Reviews</span>
                      <span className="text-sm font-medium text-slate-700">
                        {reviewCount}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfilePage;