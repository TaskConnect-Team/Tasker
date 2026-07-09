import { AnimatePresence, motion } from 'framer-motion';

const MobileFilterSheet = ({ isOpen, onClose, onClear, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 z-40 bg-slate-900/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5 shadow-2xl"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Filters</div>
            <button
              type="button"
              onClick={onClear}
              className="text-xs   rounded-full bg-slate-200 px-2 py-1 hover:bg-slate-300 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
          <div className="mt-4">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default MobileFilterSheet;
