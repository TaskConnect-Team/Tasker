import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  Clock,
  User,
  Tag,
  Star,
  Calendar,
  Briefcase,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Eye,
  Send,
  BadgeCheck,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const TaskCard = ({ task, skills = [], onAccept, isAccepting, isAssigned }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const category = task.category || 'General';
  const match = skills.includes(String(task.category || '').toLowerCase());
  const isUrgent = task.urgency === 'urgent';
  const statusMap = {
    open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'in-progress': { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    reviewed: { label: 'Reviewed', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  };

  const status = statusMap[task.status] || statusMap.open;

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/tasks/${task._id}`);
  };

  const handleAccept = (e) => {
    e.stopPropagation();
    if (onAccept) {
      onAccept(task._id);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Flexible';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-indigo-200 cursor-pointer"
      // onClick={handleViewDetails}
    >
      {/* Status Badge - Top Right */}
      <div className="absolute -top-2 -right-2 z-10">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            task.status === 'open' ? 'bg-emerald-500 animate-pulse' :
            task.status === 'assigned' ? 'bg-blue-500' :
            task.status === 'in-progress' ? 'bg-indigo-500 animate-pulse' :
            'bg-slate-400'
          }`} />
          {status.label}
        </span>
      </div>

      {/* Urgent Badge - Top Left */}
      {isUrgent && (
        <div className="absolute -top-2 -left-2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md">
            <AlertCircle className="h-3 w-3" />
            Urgent
          </span>
        </div>
      )}

      {/* Skill Match Badge */}
      {match && (
        <div className="absolute top-3 right-14 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
            <BadgeCheck className="h-3 w-3" />
            Skill Match
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Header: Title & Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
              {task.title}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                <Tag className="h-3 w-3" />
                {category}
              </span>
              {task.city && (
                <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                  <MapPin className="h-3 w-3" />
                  {task.city}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-emerald-600">
              Rs. {task.price?.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              {task.scheduledAt ? (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.scheduledAt)}
                </span>
              ) : (
                'Flexible'
              )}
            </div>
          </div>
        </div>

        {/* Description Preview */}
        {task.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Meta Info Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
          {task.customer?.name && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {task.customer.name}
            </span>
          )}
          {task.scheduledAt && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatTime(task.scheduledAt)}
            </span>
          )}
          {task.status === 'in-progress' && (
            <span className="inline-flex items-center gap-1 text-indigo-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              In Progress
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Left side: Accept Button (if tasker) */}
          {task.status === 'open' && onAccept && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={isAccepting}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-indigo-700 hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isAccepting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Accepting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Accept Task
                </>
              )}
            </button>
          )}

          {/* Assigned indicator */}
          {task.status === 'assigned' && isAssigned && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
              <CheckCircle className="h-3.5 w-3.5" />
              Assigned to you
            </span>
          )}

          {/* Spacer to push View Details to the right */}
          <div className="flex-1" />

          {/* View Details Button */}
          <button
            type="button"
            onClick={handleViewDetails}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-indigo-300 group-hover:border-indigo-200"
          >
            View Details
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* AI Score Indicator (if available) */}
        {task.confidenceScore && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500"
                style={{ width: `${task.confidenceScore}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
              {task.confidenceScore}% match
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;