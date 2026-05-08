import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Filter, MapPin, SlidersHorizontal, Star } from 'lucide-react';
import api from '../../api/axios';
import BrowseTopBar from '../../components/layout/BrowseTopBar';
import AutoCompleteSelect from '../../components/ui/AutoCompleteSelect';
import { SHARED_SKILLS } from '../../constants/skills';

const SkeletonCard = ({ delay }) => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
  >
    <div className="h-4 w-1/2 rounded bg-slate-200"></div>
    <div className="mt-3 h-3 w-1/3 rounded bg-slate-100"></div>
    <div className="mt-4 h-3 w-full rounded bg-slate-100"></div>
  </div>
);




const FiltersPanel = ({ formState, handleChange, filterSkills, setFilterSkills, handleApply, handleClear, isMobile = false }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className=' justify-between hidden lg:flex'>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Filter className="h-4 w-4" />
        Filters
      </div>
      <button
        type="button"
        onClick={handleClear}
        className="text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-full bg-slate-200 p-2 cursor-pointer "
      >
        Reset Filters
      </button>
    </div>
    <form onSubmit={handleApply} className="mt-4 space-y-4 text-sm">
      <label className="block">
        Skills
        <div className="mt-2 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <AutoCompleteSelect
            label=""
            values={SHARED_SKILLS}
            selectedValues={filterSkills}
            onValueChange={setFilterSkills}
            placeholder="e.g. Plumbing, Painting..."
          />
        </div>

      </label>
      <label className="block">
        Hourly Rate
        <div className="mt-2 flex gap-2">
          <input
            name="minRate"
            // value={formState.minRate}
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
      <div>
        <button
          type="submit"
          className="inline-flex hover:bg-indigo-700 cursor-pointer items-center justify-start gap-2 bg-indigo-500 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary/90"
        >
          {/* <Wallet className="h-4 w-4" /> */}
          Apply Filters
        </button>
      </div>
    </form>
  </div>
);

function BrowseTaskersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [taskers, setTaskers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [filterSkills, setFilterSkills] = useState([]);


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
  const defaultFilters = {
    q: formState.q || '',
    skills: '',
    city: '',
    minRate: '',
    maxRate: '',
    minRating: '',
  };

  useEffect(() => {
    setFormState(filters);

    if (filters.skills) {
      setFilterSkills(filters.skills.split(','));
    } else {
      setFilterSkills([]);
    }

  }, [filters]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

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
    if (filterSkills.length) {
      params.skills = filterSkills.join(',');
    }
    setSearchParams(params);
    setIsFilterOpen(false);
  };

  const handleClear = () => {
    setFormState(defaultFilters);
    setFilterSkills([]);
    setIsFilterOpen(false);
    setSearchParams({});
  };



  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
        <BrowseTopBar
          formState={formState}
          handleChange={handleChange}
          handleApply={handleApply}
          setIsFilterOpen={setIsFilterOpen}
          searchInputRef={searchInputRef}
          placeholder="Search for tasks..."
        />

        <div className="mt-4 flex flex-col gap-6 lg:flex-row px-4 pb-10 pt-12">
          <section className="flex-1 space-y-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} delay={index * 150} />
                ))}
              </div>
            ) : taskers.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {taskers.map((tasker) => (
                  <div
                    role='button'
                    onClick={() => navigate(`/profile/${tasker.id}`)}
                    key={tasker.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-default hover:scale-105 transition">
                    <div className="flex items-center gap-4 ">
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

          <aside className="hidden w-full max-w-sm lg:block">
            <FiltersPanel
              formState={formState}
              handleChange={handleChange}
              filterSkills={filterSkills}
              setFilterSkills={setFilterSkills}
              handleApply={handleApply}
              handleClear={handleClear}
            />
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5 shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Filters</div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs   rounded-full bg-slate-200 px-2 py-1 hover:bg-slate-300 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
              <div className="mt-4">
                <FiltersPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BrowseTaskersPage;
