import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, MapPin, Star, SlidersHorizontal } from 'lucide-react';
import api from '../../api/axios';

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="h-4 w-1/2 rounded bg-slate-200"></div>
    <div className="mt-3 h-3 w-1/3 rounded bg-slate-100"></div>
    <div className="mt-4 h-3 w-full rounded bg-slate-100"></div>
  </div>
);

function BrowseTaskersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [taskers, setTaskers] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      skills: searchParams.get('skills') || '',
      city: searchParams.get('city') || '',
      minRate: searchParams.get('minRate') || '',
      maxRate: searchParams.get('maxRate') || '',
      minRating: searchParams.get('minRating') || '',
    }),
    [searchParams]
  );

  const [formState, setFormState] = useState(filters);

  useEffect(() => {
    setFormState(filters);
  }, [filters]);

  useEffect(() => {
    let mounted = true;

    const fetchTaskers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users/search-taskers', { params: filters });
        if (mounted) {
          setTaskers(data.taskers || []);
        }
      } catch (error) {
        if (mounted) {
          setTaskers([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTaskers();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = (event) => {
    event.preventDefault();
    const params = {};
    Object.entries(formState).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    setSearchParams(params);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
      <aside className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <form onSubmit={handleApply} className="mt-4 space-y-4 text-sm">
          <label className="block">
            Skills
            <div className="mt-2 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <input
                name="skills"
                value={formState.skills}
                onChange={handleChange}
                placeholder="Cleaning, Delivery"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
          </label>
          <label className="block">
            Hourly Rate
            <div className="mt-2 flex gap-2">
              <input
                name="minRate"
                value={formState.minRate}
                onChange={handleChange}
                placeholder="Min"
                type="number"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                name="maxRate"
                value={formState.maxRate}
                onChange={handleChange}
                placeholder="Max"
                type="number"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
          </label>
          <label className="block">
            Rating
            <div className="mt-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-slate-400" />
              <input
                name="minRating"
                value={formState.minRating}
                onChange={handleChange}
                placeholder="4.5"
                type="number"
                step="0.1"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
          </label>
          <label className="block">
            City
            <div className="mt-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <input
                name="city"
                value={formState.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </button>
        </form>
      </aside>

      <section className="flex-1 space-y-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : taskers.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {taskers.map((tasker) => (
              <div key={tasker.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <img
                    src={tasker.profileImage || 'https://img.magnific.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_hybrid&w=740&q=80'}
                    alt={tasker.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-base font-semibold text-slate-900">{tasker.name}</p>
                    <p className="text-xs text-slate-500">{tasker.tagline || 'Reliable pro'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {tasker.location || 'Remote'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(tasker.skills || []).slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-900">
                  <span>{tasker.hourlyRate ? `$${tasker.hourlyRate}/hr` : 'Rate on request'}</span>
                  <span>⭐ {tasker.trustScore}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${tasker.id}`)}
                  className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No taskers matched your filters.
          </div>
        )}
      </section>
    </div>
  );
}

export default BrowseTaskersPage;
