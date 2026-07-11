import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ClipboardList, Clock, Hourglass, XCircle } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import TaskerTrackingModel from '../../models/TaskerTrackingModel';
import ReviewBottomSheet from '../../components/common/ReviewBottomSheet';
import { useTaskTracking } from '../../context/TaskTrackingContext';

const statusLabel = {
  open: 'Open',
  assigned: 'Assigned',
  'in-progress': 'In Progress',
  completed: 'Completed',
  reviewed: 'Reviewed',
  cancelled: 'Cancelled',
};

function OrdersPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('open');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const navigate = useNavigate();

  const { startTracking, stopTracking } = useTaskTracking();

  const role = user?.role ?? 'customer';


  const dynamicTabs = useMemo(() => {
    const baseTabs = [
      { key: 'assigned', label: 'Assigned', icon: Clock },
      { key: 'in-progress', label: 'In-Progress', icon: Hourglass },
      { key: 'completed', label: 'Completed', icon: CheckCircle2 },
      { key: 'cancelled', label: 'Cancelled', icon: XCircle },
    ];

    if (role === 'customer') {
      return [{ key: 'open', label: 'Open', icon: ClipboardList }, ...baseTabs];
    }

    if (role === 'tasker') {
      return baseTabs;
    }

    return baseTabs;
  }, [role]);

  const tabKeys = useMemo(() => dynamicTabs.map((tab) => tab.key), []);
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'tasker' ? '/tasks/tasker' : '/tasks/myTasks';
      const { data } = await api.get(endpoint);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchTasks();
  }, [role, user]);

  useEffect(() => {
    const nextTab = location.state?.activeTab;
    if (nextTab && tabKeys.includes(nextTab)) {
      setActiveTab(nextTab);
    }
  }, [location.state, tabKeys]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (activeTab === 'completed') {
          return ['completed', 'reviewed'].includes(task.status);
        }

        return task.status === activeTab;
      }),
    [tasks, activeTab]
  );

  const updateTaskStatus = (taskId, nextStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId
          ? {
            ...task,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          }
          : task
      )
    );
  };

  const handleCancel = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/cancel`);
      updateTaskStatus(taskId, 'cancelled');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to cancel task');
    }
  };

  const handleStart = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/start`);
      updateTaskStatus(taskId, 'in-progress');

      // Find the specific task and start the global tracker
      const taskToTrack = tasks.find(t => t._id === taskId);
      if (taskToTrack) startTracking(taskToTrack);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to start task');
    }
  };

  const handleFinish = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/finish`);
      updateTaskStatus(taskId, 'completed');

      // Stop tracking upon success
      stopTracking();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleOpenReview = (task) => {
    setSelectedTask(task);
    setIsReviewOpen(true);
  };

  const handleCloseReview = () => {
    setIsReviewOpen(false);
    setSelectedTask(null);
  };

  const handleTrackTasker = (task) => {
    setSelectedTask(task);
    setIsMapModalOpen(true);
  }

  const handleCloseMapModal = () => {
    setIsMapModalOpen(false);
    setSelectedTask(null);
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
      <div className="flex flex-wrap gap-3">
        {dynamicTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive
                ? 'border-primary bg-primary/10 text-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Loading tasks...
            </div>
          ) : filteredTasks.length ? (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className="flex gap-4 rounded-2xl border border-slate-200 hover:shadow-lg transition-all bg-white p-6 shadow-sm md:flex-row items-center justify-between"
              >
                <div className="flex flex-col items-center gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{task.city || 'Remote'}</span>
                      <span className="rounded-full border border-slate-200 px-2 py-0.5">
                        {statusLabel[task.status] ?? task.status}
                      </span>
                      <span>Rs. {task.price}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {role === 'customer' && task.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleCancel(task._id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    )}
                    {role === 'customer' && task.status === 'in-progress' && (
                      <button
                        type="button"
                        onClick={() => handleTrackTasker(task)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Track Tasker
                      </button>
                    )}
                    {role === 'customer' && task.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleOpenReview(task)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Leave a Review
                      </button>
                    )}
                    {role === 'customer' && task.status === 'reviewed' && (
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"
                        disabled
                      >
                        Reviewed
                      </button>
                    )}
                    {role === 'tasker' && task.status === 'assigned' && (
                      <button
                        type="button"
                        onClick={() => handleStart(task._id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Start Work
                      </button>
                    )}
                    {role === 'tasker' && task.status === 'in-progress' && (
                      <button
                        type="button"
                        onClick={() => handleFinish(task._id)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>

                </div>
                <div className="flex justify-center items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No active works yet.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <ReviewBottomSheet
        task={selectedTask}
        isOpen={isReviewOpen}
        onClose={handleCloseReview}
        onSuccess={fetchTasks}
      />

      {isMapModalOpen && selectedTask && selectedTask.geoLocation.coordinates ? (
        <TaskerTrackingModel
          isOpen={isMapModalOpen}
          onClose={handleCloseMapModal}
          taskId={selectedTask._id}
          destinationCoordinates={selectedTask?.geoLocation?.coordinates}
        />
      ) : null}
    </section>
  );
}

export default OrdersPage;
