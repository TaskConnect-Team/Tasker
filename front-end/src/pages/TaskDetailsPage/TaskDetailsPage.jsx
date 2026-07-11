// frontend/src/pages/TaskDetailsPage.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  DollarSign,
  MapPin,
  Tag,
  User,
  Sparkles,
  Calendar,
  ChevronLeft,
  Star,
  BadgeCheck,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Map, APIProvider, Marker } from '@vis.gl/react-google-maps';
import MapViewModel from '../../models/MapViewModel';
import { useTaskTracking } from '../../context/TaskTrackingContext';
import SimilarTasksSection from '../../components/ai/SimilarTasksSection';
import AITagDisplay from '../../components/ai/AITagDisplay';
import MatchScoreBadge from '../../components/ai/MatchScoreBadge';
import { buildAITags, getTaskConfidenceScore } from '../../utils/searchHelpers';

function TaskDetailsPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const { startTracking, stopTracking } = useTaskTracking();

  const fetchTask = useCallback(async (isMountedRef) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}`);

      if (isMountedRef.current) {
        setTask(data);
      }
    } catch (fetchError) {
      if (isMountedRef.current) {
        toast.error(fetchError?.response?.data?.message || 'Failed to load task details');
        setTask(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [taskId]);

  useEffect(() => {
    const isMountedRef = { current: true };
    fetchTask(isMountedRef);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTask]);

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
      open: 'bg-amber-50 text-amber-700 border-amber-200',
      assigned: 'bg-blue-50 text-blue-700 border-blue-200',
      'in-progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      reviewed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return map[taskStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  }, [taskStatus]);

  const scheduledLabel = useMemo(() => {
    if (!task?.scheduledAt) {
      return 'Flexible';
    }
    const date = new Date(task.scheduledAt);
    return Number.isNaN(date.getTime())
      ? 'Flexible'
      : date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
  }, [task?.scheduledAt]);

  const categoryLabel = task?.category?.join(', ') || 'General';
  const aiTags = useMemo(() => buildAITags(task), [task]);
  const confidenceScore = useMemo(() => getTaskConfidenceScore(task), [task]);
  const isUrgent = task?.urgency === 'urgent';
  const ratingValue = task?.customer?.trustScore ?? 4.8;
  const customerName = task?.customer?.name ?? 'Customer';
  const customerId = task?.customer?._id || null;
  const coordinates = task?.geoLocation?.coordinates;
  const mapCenter = coordinates
    ? { lat: coordinates[1], lng: coordinates[0] }
    : null;

  const showAccept = taskStatus === 'open' && user?.role === 'tasker';
  const showStart =
    taskStatus === 'assigned' && task?.tasker && task.tasker === user?.id;
  const showComplete =
    taskStatus === 'in-progress' && task?.tasker && task.tasker === user?.id;
  const showFinished = taskStatus === 'completed';

  const handleStatusUpdate = async (nextStatus) => {
    if (!nextStatus) return;

    setUpdating(true);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      toast.success('Status updated');

      if (nextStatus === 'in-progress') {
        startTracking(task);
      } else if (nextStatus === 'completed' || nextStatus === 'cancelled') {
        stopTracking();
      }

      await fetchTask({ current: true });
    } catch {
      toast.error('Unable to update task status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="text-sm text-slate-500">Loading task details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Task Not Found</h3>
          <p className="mt-2 text-sm text-slate-500">
            The task you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="min-h-screen bg-slate-50/50 pb-32 lg:pb-8">
        <div className="mx-auto w-full max-w-6xl px-2 py-4 pb-16 lg:px-8 lg:py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Header Card */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
              >
                {/* Status & Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {statusLabel}
                    </span>
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Urgent
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    PKR {task.price?.toLocaleString()}
                  </span>
                </div>

                {/* Title */}
                <h1 className="mt-4 text-2xl font-semibold text-slate-900 lg:text-3xl">
                  {task.title}
                </h1>

                {/* Quick Info Chips */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <Tag className="h-3.5 w-3.5" />
                    {categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <MapPin className="h-3.5 w-3.5" />
                    {task.city || 'Location TBD'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <Calendar className="h-3.5 w-3.5" />
                    {scheduledLabel}
                  </span>
                </div>
              </motion.section>

              {/* AI Tags & Insights Section */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-semibold text-slate-900">AI Insights</h2>
                  <span className="ml-auto text-xs text-slate-400">Powered by Gemini</span>
                </div>

                <div className="mt-5 space-y-5">
                  {/* Confidence Score */}
                  {user?.role === 'tasker' && confidenceScore !== null && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Task Clarity Score</span>
                        <span className="text-sm font-semibold text-indigo-600">
                          {confidenceScore}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500"
                          style={{ width: `${confidenceScore}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {confidenceScore >= 80
                          ? '✅ Well-defined task with clear requirements'
                          : confidenceScore >= 50
                            ? '📝 Good description, could add more detail'
                            : '✏️ Add more details for better matches'}
                      </p>
                    </div>
                  )}

                  {/* AI Tags */}
                  {aiTags && aiTags.length > 0 && (
                    <div>
                      <h4 className="mb-2.5 text-sm font-medium text-slate-700">Suggested Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiTags.map((tag, ind) => (
                          <span
                            key={ind}
                            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
                          >
                            {tag.icon && <span className="text-indigo-400">{tag.icon}</span>}
                            {tag.name}
                            {tag.confidence && tag.confidence > 80 && (
                              <BadgeCheck className="h-3 w-3 text-emerald-500" />
                            )}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">
                        AI-suggested skills based on task description
                      </p>
                    </div>
                  )}

                  {/* Match Score */}
                  {task.matchScore && (
                    <div className="rounded-lg bg-indigo-50/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Match Score</span>
                        <MatchScoreBadge score={task.matchScore} size="md" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>

              {/* Description */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
              >
                <h2 className="text-lg font-semibold text-slate-900">Task Description</h2>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {task.description}
                </div>
              </motion.section>

              {/* Similar Tasks */}
              {user?.role === 'tasker' && (
                <SimilarTasksSection taskId={taskId} limit={4} />
              )}
            </div>

            {/* RIGHT COLUMN - Sidebar */}
            <div className="space-y-6">
              {/* Customer Card */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Customer
                </h3>
                <div
                  className="group flex cursor-pointer items-center gap-4 rounded-lg p-2 transition-colors hover:bg-slate-50"
                  onClick={() => {
                    if (customerId) {
                      navigate(`/profile/${customerId}`);
                    } else {
                      toast.error('Customer profile not available');
                    }
                  }}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {customerName}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{ratingValue.toFixed(1)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400">Customer</span>
                    </div>
                  </div>
                  <ChevronLeft className="h-4 w-4 -rotate-180 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </motion.section>

              {/* Location Card */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Location
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-700">{task.city || 'City not provided'}</p>
                      <p className="text-xs text-slate-400">
                        {task.locationLabel || 'Exact location shared upon assignment'}
                      </p>
                    </div>
                  </div>
                  {mapCenter && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsMapModalOpen(true)}
                    >
                      <MapPin className="h-4 w-4" />
                      View on Map
                    </Button>
                  )}
                </div>
              </motion.section>

              {/* Quick Stats */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="text-sm font-semibold text-slate-900">
                      PKR {task.price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Urgency</p>
                    <p className={`text-sm font-semibold ${isUrgent ? 'text-rose-600' : 'text-slate-700'}`}>
                      {isUrgent ? 'Urgent' : 'Normal'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {taskStatus.replace('-', ' ')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Posted</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 p-1 sm:p-4 backdrop-blur-xl shadow-[0_-8px_30px_rgba(15,23,42,0.06)] lg:relative lg:mt-6 lg:rounded-2xl lg:border lg:bg-white lg:shadow-sm lg:backdrop-blur-none"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Left: Status Info */}
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="flex items-center gap-2">
                <span className="hidden h-2 w-2 rounded-full bg-emerald-500 sm:inline-block animate-pulse" />
                <p className="text-sm font-semibold text-slate-800">Task Actions</p>
                <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-block">
                  {taskStatus}
                </span>
              </div>
              <p className="text-center text-xs text-slate-500 sm:text-left">
                {showAccept
                  ? '📋 Review the task details before accepting'
                  : showStart
                    ? '📍 Start work when you arrive at the location'
                    : showComplete
                      ? '✅ Confirm completion after finishing all work'
                      : showFinished
                        ? '🎉 Task completed successfully'
                        : '⏳ No actions available for this task'}
              </p>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {/* Cancel Button (for open tasks) */}
              {taskStatus === 'open' && user?.role === 'customer' && (
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this task?')) {
                      handleStatusUpdate('cancelled');
                    }
                  }}
                  disabled={updating}
                >
                  Cancel Task
                </Button>
              )}

              {/* Main Action Button */}
              {showAccept && (
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[140px]"
                  onClick={() => handleStatusUpdate('assigned')}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📋</span>
                      Accept Task
                    </>
                  )}
                </Button>
              )}

              {showStart && (
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[140px] bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleStatusUpdate('in-progress')}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Start Work
                    </>
                  )}
                </Button>
              )}

              {showComplete && (
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[140px] bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✅</span>
                      Mark Complete
                    </>
                  )}
                </Button>
              )}

              {showFinished && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 border border-emerald-200">
                  <span className="text-lg">✅</span>
                  Task Completed
                  <span className="ml-1 text-xs font-normal text-emerald-500">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* View on Map Button (mobile) */}
              {mapCenter && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setIsMapModalOpen(true)}
                >
                  <MapPin className="h-4 w-4" />
                  Map
                </Button>
              )}
            </div>
          </div>

          {/* Progress Indicator for Active Tasks */}
          {(taskStatus === 'assigned' || taskStatus === 'in-progress') && (
            <div className="absolute bottom-full left-0 right-0 mx-auto mb-3 hidden max-w-2xl rounded-lg bg-indigo-50 px-4 py-2 text-center text-xs text-indigo-700 border border-indigo-100 sm:block">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                </span>
                {taskStatus === 'assigned'
                  ? '📌 Task assigned - Start work when you arrive'
                  : '🔧 Work in progress - Complete when finished'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Map Modal */}
        {isMapModalOpen && mapCenter && (
          <MapViewModel
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            mapCenter={mapCenter}
          />
        )}
      </div>
    </APIProvider>
  );
}

export default TaskDetailsPage;