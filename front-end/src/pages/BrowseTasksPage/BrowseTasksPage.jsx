import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, MapPin, Tag } from 'lucide-react';
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


const FiltersPanel = ({ formState, filterCategory, setFilterCategory, handleChange, handleApply, handleClear, isMobile = false }) => (
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
        Budget Range
        <div className="mt-2 flex gap-2">
          <input
            name="minPrice"
            value={formState.minPrice}
            onChange={handleChange}
            placeholder="Min"
            type="number"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            name="maxPrice"
            value={formState.maxPrice}
            onChange={handleChange}
            placeholder="Max"
            type="number"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>
      </label>
      <label className="block">
        Category
        <div className="mt-2 flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400" />
          {/* <input
            name="category"
            value={formState.category}
            onChange={handleChange}
            placeholder="Plumbing"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          /> */}
          <AutoCompleteSelect
            label=""
            values={SHARED_SKILLS}
            selectedValues={filterCategory}
            onValueChange={setFilterCategory}
            placeholder="e.g. Plumbing, Painting..."
          />
        </div>
      </label>
      <label className="block">
        Location
        <div className="mt-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <input
            name="location"
            value={formState.location}
            onChange={handleChange}
            placeholder="City or neighborhood"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>
      </label>
      <label className="block">
        Status
        <select
          name="status"
          value={formState.status}
          onChange={handleChange}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
        >
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
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

function BrowseTasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState([]);
  const [searchMode, setSearchMode] = useState(searchParams.get('mode') || 'ai');
  const [searchSource, setSearchSource] = useState(null);
  const searchInputRef = useRef(null);

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      category: searchParams.get('category') || '',
      location: searchParams.get('location') || '',
      status: searchParams.get('status') || 'open',
    }),
    [searchParams]
  );

  const [formState, setFormState] = useState(filters);
  const defaultFilters = {
    q: formState.q || '',
    minPrice: '',
    maxPrice: '',
    category: '',
    location: '',
    status: 'open',
  };

  useEffect(() => {
    setFormState(filters);

    if (filters.category) {
      setFilterCategory(filters.category.split(','));
    } else {
      setFilterCategory([]);
    }
  }, [filters]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const hasSearchTerms = Boolean(filters.q || filters.category);
        let taskResults = [];


        if (!filters.q.trim()) {
          setTasks([]);
          return;
        }

        if (searchMode === 'ai' && hasSearchTerms) {
          try {
            const { data } = await api.get('/ai/tasks/search', { params: filters });
            taskResults = data?.data || [];
            setSearchSource(data?.sources?.vector ? 'vector' : 'text');
          } catch (error) {
            toast.error('AI task search is unavailable. Using standard search.');
            const { data } = await api.get('/tasks/search', { params: filters });
            taskResults = data;
            setSearchSource('text');
          }
        } else {
          const { data } = await api.get('/tasks/search', { params: filters });
          taskResults = data;
          setSearchSource('text');
        }

        if (mounted) {
          setTasks(taskResults);
        }
      } catch (error) {
        if (mounted) {
          toast.error(error?.response?.data?.message || 'Failed to load tasks');
          setTasks([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTasks();

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
    Object.entries(formState).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
      if (filterCategory.length) {
        params.category = filterCategory.join(',');
      }
    });
    if (searchMode) {
      params.mode = searchMode;
    }
    setSearchParams(params);
    setIsFilterOpen(false);
  };

  const handleClear = () => {
    setFormState(defaultFilters);
    setIsFilterOpen(false);
    setFilterCategory([]);
    setSearchSource(null);
    setSearchParams({ status: 'open' });
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
          aiActive={searchMode === 'ai'}
          isSearching={loading}
        />

        <div className="mt-[60px] flex flex-col gap-6 lg:flex-row">
          {/* 1. Task List */}
          <section className="flex-1 space-y-4">
            <SearchModeToggle mode={searchMode} setMode={setSearchMode} isLoading={loading} />
            <SearchSourceIndicator source={searchSource} count={tasks.length} isLoading={loading} />
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} delay={index * 150} />
                ))}
              </div>
            ) : tasks.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    type="button"
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    className="text-left"
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-lg cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-sm font-semibold text-slate-900">Rs. {task.price}</span>
                          {searchMode === 'ai' && <MatchScoreBadge score={task.score || task.matchScore} />}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{task.description}</p>
                      {searchMode === 'ai' && (
                        <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          AI relevance: {task.category?.[0] || 'best fit'}
                        </span>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {task.location}
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 uppercase">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                No tasks matched! Update your search or filters.
              </div>
            )}
          </section>

          <aside className="hidden w-full max-w-sm lg:block">
            {/* 2. UPDATE THE DESKTOP CALL */}
            <FiltersPanel
              formState={formState}
              handleChange={handleChange}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
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
          handleApply={handleApply}
          handleClear={handleClear}
          isMobile={true}
        />
      </MobileFilterSheet>
    </div>
  );
}

export default BrowseTasksPage;
