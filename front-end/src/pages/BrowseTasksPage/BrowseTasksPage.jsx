import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, MapPin, Wallet, Tag } from 'lucide-react';
import api from '../../api/axios';

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="h-4 w-1/2 rounded bg-slate-200"></div>
    <div className="mt-3 h-3 w-1/3 rounded bg-slate-100"></div>
    <div className="mt-4 h-3 w-full rounded bg-slate-100"></div>
  </div>
);

function BrowseTasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setFormState(filters);
  }, [filters]);

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
              <input
                name="category"
                value={formState.category}
                onChange={handleChange}
                placeholder="Plumbing"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
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
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <Wallet className="h-4 w-4" />
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
        ) : tasks.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => navigate(`/tasks/${task._id}`)}
                className="text-left"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
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
    </div>
  );
}

export default BrowseTasksPage;
