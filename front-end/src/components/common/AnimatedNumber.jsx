import { useEffect, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion';

function AnimatedNumber({ value = 0, duration = 1.5 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });

    return () => controls.stop();
  }, [motionValue, value, duration]);

  useMotionValueEvent(motionValue, 'change', (latest) => {
    setDisplayValue(Math.round(latest));
  });

  return <span>{displayValue}</span>;
}

export default AnimatedNumber;
