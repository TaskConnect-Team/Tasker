import { Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const linkBase =
  'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors';

function Sidebar({ isOpen, onClose, mainItems, moreItems }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleAction = async (item) => {
    if (item.action === 'logout') {
      await logout();
      navigate('/login', { replace: true });
      onClose();
    }
  };

  return (
    <Fragment>
      <aside className="hidden w-64 border-r border-slate-200 bg-white px-4 py-6 md:flex md:flex-col">
        <div className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Main
        </div>
        <nav className="space-y-2">
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? 'bg-slate-300 text-white' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="my-6 h-px bg-slate-200" />
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          More
        </div>
        <nav className="space-y-2">
          {moreItems.map((item) => (
            item.action ? (
              <button
                key={item.label}
                type="button"
                onClick={() => handleAction(item)}
                className={`${linkBase} w-full text-left text-slate-700 hover:bg-slate-100`}
              >
                {item.label}
              </button>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                className={`${linkBase} text-slate-600 hover:bg-slate-100`}
              >
                {item.label}
              </NavLink>
            )
          ))}
        </nav>
      </aside>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute inset-0 bg-slate-300/40"
              aria-label="Close sidebar"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="relative h-full w-72 bg-white p-6"
            >
              <div className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                More
              </div>
              <nav className="space-y-2">
                {moreItems.map((item) => (
                  item.action ? (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleAction(item)}
                      className={`${linkBase} w-full text-left text-slate-700 hover:bg-slate-100`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      className={`${linkBase} text-slate-700 hover:bg-slate-100`}
                    >
                      {item.label}
                    </NavLink>
                  )
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Fragment>
  );
}

export default Sidebar;
