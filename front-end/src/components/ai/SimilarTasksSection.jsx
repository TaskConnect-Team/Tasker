import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, MapPin, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import MatchScoreBadge from './MatchScoreBadge';

function SimilarTasksSection({ taskId, limit = 4 }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSimilarTasks = async () => {
      if (!taskId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await api.get(`/ai/tasks/${taskId}/similar`, { params: { limit } });
        const results = data?.data || data?.tasks || [];

        if (mounted) {
          setTasks(results);
        }
      } catch (error) {
        if (mounted) {
          setTasks([]);
          toast.error(error?.response?.data?.message || 'Similar tasks are unavailable right now');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSimilarTasks();

    return () => {
      mounted = false;
    };
  }, [taskId, limit]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Similar Tasks You Might Like</h2>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : tasks.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tasks.slice(0, limit).map((task) => (
            <button
              key={task._id || task.id}
              type="button"
              onClick={() => {
                // 1. Force the layout layout container or window to shift instantly to the top
                window.scrollTo({ top: 0, behavior: 'instant' });
                // 2. Perform path transition
                navigate(`/tasks/${task._id || task.id}`);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{task.title}</h3>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-600">{task.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <MatchScoreBadge score={task.score || task.matchScore || 0.64} />
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {task.city || task.location || 'Nearby'}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          No similar tasks found yet.
        </p>
      )}
    </section>
  );
}

export default SimilarTasksSection;
