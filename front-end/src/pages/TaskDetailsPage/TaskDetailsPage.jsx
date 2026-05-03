import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, DollarSign } from 'lucide-react';
import api from '../../api/axios';

function TaskDetailsPage() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchTask = async () => {
      try {
        const { data } = await api.get(`/tasks/${taskId}`);
        if (mounted) {
          setTask(data);
        }
      } catch (error) {
        if (mounted) {
          setTask(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTask();

    return () => {
      mounted = false;
    };
  }, [taskId]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading task...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Task not found.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{task.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{task.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {task.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ${task.price}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Bid / Apply
          </button>
        </div>
      </section>
    </div>
  );
}

export default TaskDetailsPage;
