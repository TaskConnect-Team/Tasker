import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, MapPin, SlidersHorizontal, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import BrowseTopBar from '../../components/layout/BrowseTopBar';
import AutoCompleteSelect from '../../components/ui/AutoCompleteSelect';
import SkeletonCard from '../../components/common/SkeletonCard';
import MobileFilterSheet from '../../components/common/MobileFilterSheet';
import SearchModeToggle from '../../components/ai/SearchModeToggle';
import MatchScoreBadge from '../../components/ai/MatchScoreBadge';
import SearchSourceIndicator from '../../components/ai/SearchSourceIndicator';
import { SHARED_SKILLS } from '../../constants/skills';
import { PAKISTAN_CITIES } from '../../constants/cities';
import SingleAutoCompleteSelect from '../../components/ui/SingleAutoCompleteSelect';




const FiltersPanel = ({ formState, handleChange, filterSkills, setFilterSkills, city, setCity, handleApply, handleClear, isMobile = false }) => (
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
            value={formState.minRate || ''}
            onChange={handleChange}
            placeholder="Min"
            type="number"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            name="maxRate"
            value={formState.maxRate || ''}
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
            value={formState.minRating || ''}
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
          <SingleAutoCompleteSelect
            values={PAKISTAN_CITIES}
            selectedValue={city}
            onValueChange={setCity}
            placeholder="e.g. Peshawar, Swabi..."
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
  const [searchMode, setSearchMode] = useState(searchParams.get('mode') || 'ai');
  const [searchSource, setSearchSource] = useState(null);
  const searchInputRef = useRef(null);
  const [filterSkills, setFilterSkills] = useState([]);
  const [city, setCity] = useState('');


  const filters = useMemo(() => {
    const params = {};

    const getParam = (key) => searchParams.get(key)?.trim() || '';
    const q = getParam('q');
    const skills = getParam('skills');
    const city = getParam('city');
    const minRate = getParam('minRate');
    const maxRate = getParam('maxRate');
    const minRating = getParam('minRating');


    // Normalize 'q' on the fly before sending to API
    if (q) params.q = q.replace(/\s+/g, ' ');
    if (skills) params.skills = skills;
    if (city) params.city = city;
    if (minRate) params.minRate = minRate;
    if (maxRate) params.maxRate = maxRate;
    if (minRating) params.minRating = minRating;

    return params;
  }, [searchParams]);


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
    if (filters.city) {
      setCity(filters.city);
    } else {
      setCity('');
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
        const hasSearchTerms = Boolean(filters.q);
        const requestFilters = { ...filters, skills: filters.skills || undefined };
        let taskerResults = [];

        if (!filters.q.trim()) {
          setTaskers([]);
          return;
        }

        if (searchMode === 'ai' && hasSearchTerms) {
          try {
            const { data } = await api.get('/ai/search', { params: requestFilters });
            taskerResults = data?.data || [];
            setSearchSource(data?.sources?.vector ? 'vector' : 'text');
          } catch (error) {
            console.warn("using standard search due to AI search failure!");
            const { data } = await api.get('/users/search-taskers', { params: filters });
            taskerResults = data.taskers || [];
            setSearchSource('text');
          }
        } else {
          const { data } = await api.get('/users/search-taskers', { params: filters });
          taskerResults = data.taskers || [];
          setSearchSource('text');
        }

        if (mounted) {
          setTaskers(taskerResults);
        }
      } catch (error) {
        if (mounted) {
          // toast.error(error?.response?.data?.message || 'Failed to load taskers');
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
  }, [filters, searchMode]);

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

    // 1. Safe copy for general form state
    Object.entries(formState).forEach(([key, value]) => {
      if (value && String(value).trim() !== '') {
        params[key] = typeof value === 'string' ? value.trim() : value;
      }
    });

    // 2. Only add skills if they exist
    if (filterSkills && filterSkills.length > 0) {
      params.skills = filterSkills.join(',');
    }
    else {
      delete params.skills;
    }

    // 3. Only add city if it isn't blank
    if (city && city.trim() !== '') {
      params.city = city.trim();
    }
    else {
      delete params.city;
    }

    // 4. Only add search mode if it isn't blank
    if (searchMode && searchMode.trim() !== '') {
      params.mode = searchMode.trim();
    }

    setSearchParams(params);
    setIsFilterOpen(false);
  };

  const handleClear = () => {
    const currentQuery = searchParams.get('q') || '';

    setFormState({
      ...defaultFilters,
      q: currentQuery
    });

    setFilterSkills([]);
    setCity('');
    setIsFilterOpen(false);
    setSearchSource(null);
    const newParams = {};
    if (currentQuery.trim() !== '') {
      newParams.q = currentQuery;
    }
    setSearchParams(newParams);

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
          placeholder="Search for taskers..."
          aiActive={searchMode === 'ai'}
          isSearching={loading}
        />

        <div className="mt-4 flex flex-col gap-6 lg:flex-row px-4 pb-10 pt-12">
          <section className="flex-1 space-y-4">
            <SearchModeToggle mode={searchMode} setMode={setSearchMode} isLoading={loading} />
            <SearchSourceIndicator source={searchSource} count={taskers.length} isLoading={loading} />
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} delay={index * 150} />
                ))}
              </div>
            ) :
              taskers.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {taskers.map((tasker) => (
                    <div
                      key={tasker.id || tasker._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg cursor-default  transition">
                      <div className="flex items-start justify-between gap-3">
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
                        {searchMode === 'ai' && <MatchScoreBadge score={tasker.score} />}
                      </div>
                      {searchMode === 'ai' && tasker.score >= 0.8 && (
                        <div className="mt-3 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          AI Match
                        </div>
                      )}
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
                        <span>{tasker.hourlyRate ? `Rs. ${tasker.hourlyRate}/hr` : 'Contact for rate'}</span>
                        <span>⭐ {tasker.trustScore}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${tasker.id || tasker._id}`)}
                        className="mt-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                  No taskers matched! Update your search or filters.
                </div>
              )}
          </section>

          <aside className="hidden w-full max-w-sm lg:block">
            <FiltersPanel
              formState={formState}
              handleChange={handleChange}
              filterSkills={filterSkills}
              city={city}
              setCity={setCity}
              setFilterSkills={setFilterSkills}
              handleApply={handleApply}
              handleClear={handleClear}
            />
          </aside>
        </div>
      </div>

      <MobileFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onClear={handleClear}
      >
        <FiltersPanel
          formState={formState}
          handleChange={handleChange}
          filterSkills={filterSkills}
          city={city}
          setCity={setCity}
          setFilterSkills={setFilterSkills}
          handleApply={handleApply}
          handleClear={handleClear}
        />
      </MobileFilterSheet>
    </div>
  );
}

export default BrowseTaskersPage;
