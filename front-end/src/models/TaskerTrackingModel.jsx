import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Map, Marker } from '@vis.gl/react-google-maps';
import CustomerTrackerMap from '../components/common/CustomerTrackerMap';

const TaskerTrackingModel = ({ isOpen, onClose, taskId, destinationCoordinates }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-default">
                <motion.section
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                >

                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Live tasker tracking</h3>
                            <p className="text-sm text-slate-600">Realtime location sync updates below when the tasker is active.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            {/* Fallback to text 'X' if you don't have an icon library */}
                            <X size={20} />
                        </button>
                    </div>

                    {/* Map Container */}
                    <div className="w-full h-[60vh] min-h-[400px] bg-slate-50">
                        <CustomerTrackerMap taskId={taskId} destinationCoordinates={destinationCoordinates} />
                    </div>
                </motion.section>
            </div>
        </AnimatePresence>
    );
};

export default TaskerTrackingModel;