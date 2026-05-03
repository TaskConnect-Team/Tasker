import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function TopBar({ onOpenSidebar, onAvatarClick }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const lastScrollY = useRef(0);

    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = lastScrollY.current;
        if (latest > previous && latest > 80) {
            setHidden(true);
        } else {
            setHidden(false);
        }
        lastScrollY.current = latest;
    });

    useEffect(() => {
        if (scrollY.get() < 80) {
            setHidden(false);
        }
    }, [scrollY]);

    const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'TC';

    const handleSubmit = (event) => {
        event.preventDefault();
        const term = searchTerm.trim();
        if (!term) {
            return;
        }

        const encoded = encodeURIComponent(term);
        if (user?.role === 'tasker') {
            navigate(`/browse-tasks?q=${encoded}`);
        } else {
            navigate(`/browse-taskers?q=${encoded}`);
        }
    };

    return (
        <motion.header
            initial={false}
            animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-8">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:scale-105 transition hover:bg-slate-100 md:hidden"
                    aria-label="Open sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search tasks, gigs, or messages"
                            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 pr-11 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-slate-100"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </form>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden text-right text-xs text-slate-500 md:block">
                        <div className="font-medium capitalize text-slate-700">{user?.name ?? 'TaskConnect'}</div>
                        <div className="capitalize">{user?.role ?? 'guest'}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onAvatarClick}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold transition hover:bg-slate-800 cursor-pointer hover:scale-105 text-white"
                        aria-label="Open profile drawer"
                    >
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="profile" className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <span className="text-xl">{initials}</span>
                        )}
                    </button>
                </div>
            </div>
        </motion.header>
    );
}

export default TopBar;
