import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, MapPin, Tag } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function TaskerFeed() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const skills = useMemo(() => {
    if (!user?.skills) {
      return [];
    }

    return user.skills.map((skill) => skill.toLowerCase());
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/tasks/recommended');
        if (mounted) {
          setTasks(Array.isArray(data) ? data : []);
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
  }, []);

  const handleAccept = async (taskId) => {
    setBusyId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/accept`);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading recommended tasks...
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No tasks found for your specific skills yet. Try updating your profile skills!
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Smart Feed</h1>
        <p className="text-sm text-slate-600">
          Jobs matched to your skills and location.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => {
          const category = task.category || 'General';
          const match = skills.includes(String(task.category || '').toLowerCase());

          return (
            <div
              key={task._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {category}
                    </span>
                    {task.city ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {task.city}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900">${task.price}</div>
              </div>

              {match ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                  <BadgeCheck className="h-3 w-3" />
                  Skill Match
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => handleAccept(task._id)}
                disabled={busyId === task._id}
                className=" m-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {busyId === task._id ? 'Assigning...' : 'Accept Task'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default TaskerFeed;
