import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const statusLabel = {
  open: 'Open',
  assigned: 'Assigned',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function NotificationsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role ?? 'customer';

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const endpoint = role === 'tasker' ? '/tasks/tasker' : '/tasks/my';
        const { data } = await api.get(endpoint);
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [role, user]);

  const notifications = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map((task) => ({
        id: task._id,
        title: task.title,
        status: task.status,
        updatedAt: task.updatedAt || task.createdAt,
      }));
  }, [tasks]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-600">
          Recent updates from your tasks and orders.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading notifications...
        </div>
      ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-700">
                  Task <span className="font-semibold text-slate-900">{item.title}</span> was moved to{' '}
                  <span className="font-semibold text-slate-900">{statusLabel[item.status] ?? item.status}</span>.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(item.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No notifications yet.
        </div>
      )}
    </section>
  );
}

export default NotificationsPage;
