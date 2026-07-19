// frontend/src/components/orders/OrderCard.jsx
import { motion } from 'framer-motion';
import {
  MapPin,
  DollarSign,
  Clock,
  User,
  Tag,
  Eye,
  XCircle,
  Play,
  CheckCircle,
  Star,
  Map,
  Calendar,
  ChevronRight,
  AlertCircle,
  Clock as ClockIcon,
  Package,
  UserCheck,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const OrderCard = ({
  task,
  role,
  onCancel,
  onStart,
  onFinish,
  onTrack,
  onReview,
  isProcessing,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isUrgent = task.urgency === 'urgent';
  const statusConfig = {
    open: {
      label: 'Open',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <Package className="h-4 w-4" />,
    },
    assigned: {
      label: 'Assigned',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <UserCheck className="h-4 w-4" />,
    },
    'in-progress': {
      label: 'In Progress',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <ClockIcon className="h-4 w-4" />,
    },
    completed: {
      label: 'Completed',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle className="h-4 w-4" />,
    },
    reviewed: {
      label: 'Reviewed',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Star className="h-4 w-4" />,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-slate-50 text-slate-500 border-slate-200',
      icon: <XCircle className="h-4 w-4" />,
    },
    paid: {
      label: 'Paid',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <DollarSign className="h-4 w-4" />,
    },
  };

  const status = statusConfig[task.status] || statusConfig.open;

  // Get action buttons based on role and status
  const getActionButtons = () => {
    const actions = [];

    // Customer actions
    if (role === 'customer') {
      if (task.status === 'open') {
        actions.push({
          label: 'Cancel',
          icon: <XCircle className="h-3.5 w-3.5" />,
          onClick: () => onCancel(task._id),
          variant: 'danger',
        });
      }
      if (task.status === 'in-progress') {
        actions.push({
          label: 'Track Tasker',
          icon: <Map className="h-3.5 w-3.5" />,
          onClick: () => onTrack(task),
          variant: 'primary',
        });
      }
      if (task.status === 'completed') {
        actions.push({
          label: 'Leave Review',
          icon: <Star className="h-3.5 w-3.5" />,
          onClick: () => onReview(task),
          variant: 'primary',
        });
      }
      if (task.status === 'reviewed') {
        actions.push({
          label: 'Reviewed ✓',
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          onClick: null,
          variant: 'disabled',
        });
      }
    }

    // Tasker actions
    if (role === 'tasker') {
      if (task.status === 'assigned') {
        actions.push({
          label: 'Start Work',
          icon: <Play className="h-3.5 w-3.5" />,
          onClick: () => onStart(task._id),
          variant: 'primary',
        });
      }
      if (task.status === 'in-progress') {
        actions.push({
          label: 'Complete',
          icon: <CheckCircle className="h-3.5 w-3.5" />,
          onClick: () => onFinish(task._id),
          variant: 'success',
        });
      }
    }

    return actions;
  };

  const actions = getActionButtons();

  const formatDate = (date) => {
    if (!date) return 'Flexible';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:border-indigo-200 md:p-6"
    >
      {/* Status Badge - Top Right */}
      <div className="absolute -top-2 -right-2 z-10 md:-right-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Urgent Badge */}
      {isUrgent && (
        <div className="absolute -top-2 -left-2 z-10 md:-left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md">
            <AlertCircle className="h-3 w-3" />
            Urgent
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left Section - Task Info */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors md:text-lg">
            {task.title}
          </h3>

          {/* Meta Info */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
              <Tag className="h-3 w-3" />
              {task.category || 'General'}
            </span>
            {task.city && (
              <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3" />
                {task.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
              <DollarSign className="h-3 w-3" />
              Rs. {task.price?.toLocaleString()}
            </span>
            {task.scheduledAt && (
              <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                <Calendar className="h-3 w-3" />
                {formatDate(task.scheduledAt)}
              </span>
            )}
          </div>

          {/* Tasker/Customer Name */}
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <User className="h-3.5 w-3.5" />
            <span>
              {role === 'customer' && task.tasker?.name
                ? `Tasker: ${task.tasker.name}`
                : role === 'tasker' && task.customer?.name
                ? `Customer: ${task.customer.name}`
                : 'No assignee yet'}
            </span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-2">
          {/* Action Buttons */}
          {actions.map((action, index) => (
            <button
              key={index}
              type="button"
              onClick={action.onClick}
              disabled={isProcessing || !action.onClick}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                action.variant === 'danger'
                  ? 'border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                  : action.variant === 'success'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
                  : action.variant === 'primary'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}

          {/* View Details Button */}
          <button
            type="button"
            onClick={() => navigate(`/tasks/${task._id}`)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 hover:border-indigo-300 group-hover:border-indigo-200"
          >
            <Eye className="h-3.5 w-3.5" />
            Details
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Progress Indicator for Active Tasks */}
      {(task.status === 'assigned' || task.status === 'in-progress') && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  task.status === 'assigned'
                    ? 'w-1/3 bg-blue-500'
                    : 'w-2/3 bg-indigo-500 animate-pulse'
                }`}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
              {task.status === 'assigned' ? 'Assigned' : 'In Progress'}
            </span>
          </div>
        </div>
      )}

      {/* AI Match Score (if available) */}
      {task.matchScore && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600"
              style={{ width: `${task.matchScore}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
            {task.matchScore}% match
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default OrderCard;