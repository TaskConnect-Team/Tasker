// frontend/src/components/common/LocationAccessModal.jsx
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  AlertCircle,
  User,
  Shield,
  Clock,
  X,
  Eye,
  EyeOff,
  Navigation,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const LocationAccessModal = ({
  isOpen,
  onClose,
  task,
  userRole,
  taskerId,
  currentUserId,
  autoHideDelay = 5000, // 5 seconds default
}) => {
  const [timeLeft, setTimeLeft] = useState(autoHideDelay / 1000);
  const [isVisible, setIsVisible] = useState(true);

  // Determine access type
  const isTasker = userRole === 'tasker';
  const isAssignedTasker = isTasker && taskerId === currentUserId;
  const isCustomer = userRole === 'customer';
  const isTaskOpen = task?.status === 'open';
  const isTaskAssigned = task?.status === 'assigned' || task?.status === 'in-progress';

  // Auto-hide after delay
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(autoHideDelay / 1000);
      setIsVisible(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Don't auto-close if it's an error/blocked state
          if (shouldAutoClose()) {
            onClose();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoHideDelay, onClose]);

  // Determine if modal should auto-close
  const shouldAutoClose = () => {
    // Auto-close only for informational messages, not for blocked access
    if (isCustomer && isTaskAssigned) return true;
    if (isTasker && !isAssignedTasker && isTaskAssigned) return true;
    return false;
  };

  // Determine modal content based on state
  const getModalContent = () => {
    // Case 1: Customer viewing assigned task
    if (isCustomer && isTaskAssigned) {
      return {
        icon: <User className="h-12 w-12 text-indigo-500" />,
        title: 'Tasker Assigned',
        message: `This task has been assigned to a tasker. The location is only visible to the assigned tasker for privacy and safety reasons.`,
        subMessage: 'You will be able to track the tasker once they start working.',
        type: 'info',
        action: {
          label: 'Track Tasker',
          onClick: () => {
            // Navigate to tracking or open map with tasker location
            onClose();
            // You can add navigation logic here
          },
        },
      };
    }

    // Case 2: Tasker not assigned to this task trying to view location
    if (isTasker && !isAssignedTasker && isTaskAssigned) {
      return {
        icon: <Shield className="h-12 w-12 text-amber-500" />,
        title: 'Location Restricted',
        message: `This task has been assigned to another tasker. The location is only visible to the assigned tasker for privacy and security.`,
        subMessage: 'You can browse other available tasks in your area.',
        type: 'warning',
        action: {
          label: 'Browse Tasks',
          onClick: () => {
            onClose();
            // Navigate to task browsing
          },
        },
      };
    }

    // Case 3: Open task - anyone can view
    if (isTaskOpen) {
      return {
        icon: <MapPin className="h-12 w-12 text-emerald-500" />,
        title: 'Location Available',
        message: 'This task is open and the location is visible to all taskers.',
        subMessage: 'Accept the task to start working.',
        type: 'success',
        action: {
          label: 'View Location',
          onClick: () => {
            onClose();
            // Proceed to show map
          },
        },
      };
    }

    // Case 4: Completed/cancelled task
    if (task?.status === 'completed' || task?.status === 'cancelled') {
      return {
        icon: <AlertCircle className="h-12 w-12 text-slate-400" />,
        title: 'Task Inactive',
        message: `This task has been ${task?.status}. The location is no longer available.`,
        subMessage: 'You can view completed tasks in your order history.',
        type: 'neutral',
        action: {
          label: 'View Orders',
          onClick: () => {
            onClose();
            // Navigate to orders
          },
        },
      };
    }

    // Default fallback
    return {
      icon: <MapPin className="h-12 w-12 text-slate-400" />,
      title: 'Location Unavailable',
      message: 'The location for this task is not available at this time.',
      subMessage: 'Please try again later.',
      type: 'neutral',
      action: {
        label: 'Close',
        onClick: onClose,
      },
    };
  };

  const content = getModalContent();
  const shouldAutoHide = shouldAutoClose();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Auto-hide Timer Indicator */}
          {shouldAutoHide && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
              <motion.div
                className="h-full bg-indigo-500"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: autoHideDelay / 1000, ease: 'linear' }}
                onAnimationComplete={() => {
                  if (shouldAutoHide) {
                    onClose();
                  }
                }}
              />
            </div>
          )}

          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className={`rounded-full p-4 ${
                  content.type === 'info'
                    ? 'bg-indigo-50'
                    : content.type === 'warning'
                    ? 'bg-amber-50'
                    : content.type === 'success'
                    ? 'bg-emerald-50'
                    : 'bg-slate-50'
                }`}
              >
                {content.icon}
              </div>
            </div>

            {/* Title */}
            <h3 className="mt-4 text-center text-xl font-semibold text-slate-900">
              {content.title}
            </h3>

            {/* Message */}
            <p className="mt-2 text-center text-sm text-slate-600 leading-relaxed">
              {content.message}
            </p>

            {/* Sub-message */}
            {content.subMessage && (
              <p className="mt-1.5 text-center text-xs text-slate-400">
                {content.subMessage}
              </p>
            )}

            {/* Action Button */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={content.action.onClick}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  content.type === 'info'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : content.type === 'warning'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : content.type === 'success'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {content.action.label}
              </button>

              {shouldAutoHide && (
                <p className="text-center text-xs text-slate-400">
                  Closing in {Math.ceil(timeLeft)}s
                </p>
              )}
            </div>

            {/* Additional Info for Taskers */}
            {isTasker && !isAssignedTasker && isTaskAssigned && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                <Shield className="h-3.5 w-3.5" />
                <span>Location is private for assigned tasker only</span>
              </div>
            )}

            {/* Additional Info for Customers */}
            {isCustomer && isTaskAssigned && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-indigo-50 p-2.5 text-xs text-indigo-700">
                <Clock className="h-3.5 w-3.5" />
                <span>You can track the tasker once they start working</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LocationAccessModal;