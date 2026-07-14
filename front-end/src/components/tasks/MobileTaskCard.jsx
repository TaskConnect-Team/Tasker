
// frontend/src/components/tasks/MobileTaskCard.jsx
// Add this for better mobile experience
import { motion } from 'framer-motion';
import {
  MapPin,
  DollarSign,
  Clock,
  User,
  Tag,
  ChevronRight,
  Send,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileTaskCard = ({ task, onAccept, isAccepting }) => {
  const navigate = useNavigate();
  const isUrgent = task.urgency === 'urgent';
  const statusColor = {
    open: 'bg-emerald-500',
    assigned: 'bg-blue-500',
    'in-progress': 'bg-indigo-500',
    completed: 'bg-emerald-500',
    reviewed: 'bg-purple-500',
    cancelled: 'bg-slate-400',
    paid: 'bg-emerald-500',
  }[task.status] || 'bg-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.98] transition-transform"
    //   onClick={() => navigate(`/tasks/${task._id}`)}
    >
      {/* Status Dot */}
      <div className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${statusColor} ${task.status === 'open' ? 'animate-pulse' : ''}`} />

      {/* Urgent Badge */}
      {isUrgent && (
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-semibold text-white">
            <AlertCircle className="h-2.5 w-2.5" />
            Urgent
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900 flex-1 line-clamp-2">
            {task.title}
          </h4>
          <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
            Rs. {task.price}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-0.5">
            <Tag className="h-3 w-3" />
            {task.category || 'General'}
          </span>
          {task.city && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {task.city}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {task.status === 'open' && onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(task._id);
              }}
              disabled={isAccepting}
              className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white active:scale-95 transition-transform disabled:bg-slate-300"
            >
              {isAccepting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Accepting...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Accept
                </>
              )}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tasks/${task._id}`);
            }}
            className="flex items-center gap-0.5 text-[11px] font-medium text-slate-600"
          >
            View
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileTaskCard;