import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  DollarSign,
  MapPin,
  Tag,
  User,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function TaskDetailsPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchTask = async (isMountedRef) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}`);
      if (isMountedRef.current) {
        setTask(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setTask(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const isMountedRef = { current: true };
    fetchTask(isMountedRef);

    return () => {
      isMountedRef.current = false;
    };
  }, [taskId]);

  const taskStatus = task?.status ?? 'open';
  const statusLabel = useMemo(() => {
    const map = {
      open: 'Pending',
      assigned: 'Assigned',
      'in-progress': 'In Progress',
      completed: 'Completed',
      reviewed: 'Reviewed',
      cancelled: 'Cancelled',
      paid: 'Paid',
    };

    return map[taskStatus] ?? taskStatus;
  }, [taskStatus]);

  const statusStyles = useMemo(() => {
    const map = {
      open: 'bg-amber-100 text-amber-700',
      assigned: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-indigo-100 text-indigo-700',
      completed: 'bg-emerald-100 text-emerald-700',
      reviewed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-slate-200 text-slate-600',
      paid: 'bg-emerald-100 text-emerald-700',
    };

    return map[taskStatus] ?? 'bg-slate-100 text-slate-600';
  }, [taskStatus]);

  const scheduledLabel = useMemo(() => {
    if (!task?.scheduledAt) {
      return 'Flexible';
    }

    const date = new Date(task.scheduledAt);
    return Number.isNaN(date.getTime())
      ? 'Flexible'
      : date.toLocaleString();
  }, [task?.scheduledAt]);

  const categoryLabel = task?.category?.join(', ') || 'General';
  const isUrgent = task?.urgency === 'urgent';
  const ratingValue = task?.customer?.trustScore ?? 4.8;
  const customerName = task?.customer?.name ?? 'Customer';

  const showAccept = taskStatus === 'open' && user?.role === 'tasker';
  const showStart =
    taskStatus === 'assigned' && task?.tasker && task.tasker === user?.id;
  const showComplete =
    taskStatus === 'in-progress' && task?.tasker && task.tasker === user?.id;
  const showFinished = taskStatus === 'completed';

  const handleStatusUpdate = async (nextStatus) => {
    if (!nextStatus) {
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      toast.success('Status updated');
      await fetchTask({ current: true });
    } catch (error) {
      toast.error('Unable to update task status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDirections = () => {
    if (!task?.location) {
      return;
    }

    const query = encodeURIComponent(task.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

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
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-24">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`rounded-full px-4 py-1 text-xs font-semibold ${statusStyles}`}>
              {statusLabel}
            </span>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back to tasks
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{task.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                <DollarSign className="h-4 w-4" />
                ${task.price}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                <Tag className="h-4 w-4" />
                {categoryLabel}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                  isUrgent
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Clock className="h-4 w-4" />
                {isUrgent ? 'Urgent' : 'Normal'}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">About this Task</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {task.description}
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Logistics</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{task.city || 'City not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{task.location || 'Address not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{scheduledLabel}</span>
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={handleDirections}>
                Get Directions
              </Button>
            </div>
          </motion.section>
        </div>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                {task?.customer?.profileImage ? (
                  <img
                    src={task.customer.profileImage}
                    alt={customerName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{customerName}</p>
                <p className="text-xs text-slate-500">Customer rating {ratingValue.toFixed(1)}</p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:static lg:border lg:rounded-3xl lg:bg-white lg:shadow-sm"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Task action</p>
            <p className="text-xs text-slate-500">Update the current status when ready.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {showAccept && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => handleStatusUpdate('assigned')}
                disabled={updating}
              >
                Accept Task
              </Button>
            )}
            {showStart && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => handleStatusUpdate('in-progress')}
                disabled={updating}
              >
                Start Work
              </Button>
            )}
            {showComplete && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
              >
                Mark as Completed
              </Button>
            )}
            {showFinished && (
              <Button className="w-full sm:w-auto" disabled>
                Task Finished
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default TaskDetailsPage;
