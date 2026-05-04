import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Upload, X } from 'lucide-react';
import { useState } from 'react';
const ImageOptionsModal = ({ isOpen, onClose, onUpload, imageUrl }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-default">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-80 border border-slate-200 dark:border-slate-800 z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Profile Photo</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>

          <div className="space-y-3">
            {/* Option 1: View */}
            <button 
              onClick={() => {
                onClose();
                window.open(imageUrl, '_blank')
              }}
              className="w-full cursor-pointer flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Eye size={20}/></div>
              <span className="font-medium text-slate-700 dark:text-slate-200">View Photo</span>
            </button>

            {/* Option 2: Upload */}
            <label className="w-full cursor-pointer flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Upload size={20}/></div>
              <span className="font-medium text-slate-700 dark:text-slate-200">Upload New</span>
              <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
            </label>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImageOptionsModal;