import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function BrowseTopBar({ 
    formState, 
    handleChange, 
    handleApply, 
    setIsFilterOpen, 
    searchInputRef,
    placeholder = "Search..." 
}) {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const lastScrollY = useRef(0);

    // Hide on scroll down, show on scroll up
    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = lastScrollY.current;
        if (latest > previous && latest > 80) {
            setHidden(true);
        } else {
            setHidden(false);
        }
        lastScrollY.current = latest;
    });

    return (
        <motion.header
            initial={false}
            animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed left-0 right-0 top-0 z-30 border-b border-slate-200 bg-white/95 pb-3 pt-4 backdrop-blur"
        >
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 md:px-8">
                {/* Back Button */}
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100"
                    aria-label="Go back"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>

                {/* Search Form */}
                <form onSubmit={handleApply} className="relative flex-1">
                    <input
                        ref={searchInputRef}
                        name="q"
                        value={formState.q}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {formState.q && (
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-slate-100"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    )}
                </form>

                {/* Mobile Filter Toggle */}
                <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
                    aria-label="Open filters"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </button>
            </div>
        </motion.header>
    );
}

export default BrowseTopBar;