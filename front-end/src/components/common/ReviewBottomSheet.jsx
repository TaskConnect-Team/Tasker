import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import api from '../../api/axios';

const quickTags = ['On Time', 'Expert Skills', 'Great Communication', 'Friendly', 'Clean Work'];

function ReviewBottomSheet({ task, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const taskTitle = task?.title || 'this task';

  const canSubmit = useMemo(() => rating > 0 && !submitting, [rating, submitting]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    setSelectedTags([]);
    setSubmitting(false);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!task?._id || !canSubmit) {
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        taskId: task._id,
        rating,
        comment,
        tags: selectedTags,
      });
      toast.success('Review submitted');
      setSuccess(true);
      onSuccess();
    } catch (error) {
      toast.error('Unable to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Thank you!</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Your feedback helps the community grow.
                </p>
                <Button className="mt-6" onClick={handleClose}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Review
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    How did it go with {taskTitle}?
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Share your experience to help the TaskConnect community.
                  </p>
                </div>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      whileTap={{ scale: 1.1 }}
                      onClick={() => setRating(star)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                        rating >= star
                          ? 'border-amber-400 bg-amber-100 text-amber-500'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <Star className="h-5 w-5" fill={rating >= star ? '#fbbf24' : 'none'} />
                    </motion.button>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">Quick tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          selectedTags.includes(tag)
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">Details</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Share the highlights so others can trust this tasker."
                    className="mt-2 w-full resize-none rounded-2xl border border-transparent bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-900/20 focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-sm font-semibold text-slate-500"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <Button onClick={handleSubmit} disabled={!canSubmit}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default ReviewBottomSheet;
