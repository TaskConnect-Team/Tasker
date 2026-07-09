import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';

function BottomNav({ items }) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
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

  return (
    <motion.nav
      initial={false}
      animate={{ y: hidden ? 100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-around px-4 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex h-12 w-12 items-center justify-center rounded-full text-slate-500 transition ${isActive ? 'bg-slate-300 text-white' : 'hover:bg-slate-100'}`
              }
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default BottomNav;
