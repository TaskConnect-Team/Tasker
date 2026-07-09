import { motion, AnimatePresence } from 'framer-motion';
import { Locate, MapPin, Pin, X } from 'lucide-react';
import { AdvancedMarker, Map, Marker } from '@vis.gl/react-google-maps';

const MapViewModel = ({ isOpen, onClose, mapCenter, }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-default">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                >

                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800">Task Location</h3>
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
                        <Map
                            defaultCenter={mapCenter}
                            defaultZoom={15}
                            mapId="TASK_DETAIL_MAP"
                            gestureHandling="greedy" // Allows users to pan without holding Ctrl/Cmd
                            disableDefaultUI={true}  // Keeps the UI clean
                        >
                            {/* The Red Pin Marker */}
                            {/* <Marker position={mapCenter} /> */}
                            <AdvancedMarker position={mapCenter} title="Task Location">
                            </AdvancedMarker>
                        </Map>
                    </div>

                    {/* Optional: Footer with actual directions link if they still want to drive there */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${mapCenter.lat},${mapCenter.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                        >
                            Get Driving Directions ↗
                        </a>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MapViewModel;