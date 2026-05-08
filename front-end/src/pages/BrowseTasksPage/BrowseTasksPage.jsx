import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Filter, MapPin, Search, SlidersHorizontal, Tag, Wallet } from 'lucide-react';
import api from '../../api/axios';
import BrowseTopBar from '../../components/layout/BrowseTopBar';
import AutoCompleteSelect from '../../components/ui/AutoCompleteSelect';
import { SHARED_SKILLS } from '../../constants/skills';
const SkeletonCard = ({ delay }) => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
  // 
  >
    <div className="h-4 w-1/2 rounded bg-slate-200"></div>
    <div className="mt-3 h-3 w-1/3 rounded bg-slate-100"></div>
    <div className="mt-4 h-3 w-full rounded bg-slate-100"></div>
  </div>
);


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
    q: '',
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
        const { data } = await api.get('/tasks/search', { params: filters });
        if (mounted) {
          setTasks(data);
        }
      } catch (error) {
        if (mounted) {
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
      if (filterCategory.length) {
        params.category = filterCategory.join(',');
      }
    });
    setSearchParams(params);
    setIsFilterOpen(false);
  };

  const handleClear = () => {
    setFormState(defaultFilters);
    setIsFilterOpen(false);
    setFilterCategory([]);
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
        />

        <div className="mt-[60px] flex flex-col gap-6 lg:flex-row">
          {/* 1. Task List */}
          <section className="flex-1 space-y-4">
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:scale-105 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                        <span className="text-sm font-semibold text-slate-900">${task.price}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{task.description}</p>
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
                No tasks matched your filters.
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
                {/* 3. UPDATE THE MOBILE CALL */}
                <FiltersPanel
                  formState={formState}
                  handleChange={handleChange}
                  handleApply={handleApply}
                  handleClear={handleClear}
                  isMobile={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BrowseTasksPage;
