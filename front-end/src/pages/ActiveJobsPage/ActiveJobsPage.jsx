
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useTaskerLocation from '../../hooks/useTaskerLocation';

const toDestinationCoordinates = (task) => {
  const coordinates = task?.geoLocation?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

function ActiveJobsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTasks = async () => {
      try {
        const { data } = await api.get('/tasks/tasker');
        if (isMounted) {
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error?.response?.data?.message || 'Unable to load active jobs');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeTask = useMemo(() => tasks.find((task) => task.status === 'in-progress') || null, [tasks]);
  const destinationCoordinates = useMemo(() => toDestinationCoordinates(activeTask), [activeTask]);
  const { permissionBlocked } = useTaskerLocation(
    activeTask?._id || activeTask?.id,
    destinationCoordinates,
    user?.id,
    Boolean(activeTask && activeTask.status === 'in-progress'),
  );

  useEffect(() => {
    if (permissionBlocked) {
      setPermissionModalOpen(true);
    }
  }, [permissionBlocked]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading active jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Active Jobs</h1>
        <p className="text-gray-600">Realtime tracking runs automatically for tasks that are already in progress.</p>
      </div>

      {activeTask ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{activeTask.title}</p>
              <p className="text-sm text-slate-500">{activeTask.locationLabel || activeTask.city || 'Active task'}</p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">In progress</span>
          </div>

          {destinationCoordinates ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Location publishing is active for this task. If tracking is blocked, reopen browser permissions.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No in-progress tasks yet.
        </div>
      )}

      {permissionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Location access blocked</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enable browser location access for this site so live task tracking can continue.
            </p>
            <button
              type="button"
              onClick={() => setPermissionModalOpen(false)}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ActiveJobsPage;
