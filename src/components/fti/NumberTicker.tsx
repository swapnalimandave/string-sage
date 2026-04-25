import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const NumberTicker = ({ value, prefix = '', suffix = '', duration = 0.8 }: { value: number; prefix?: string; suffix?: string; duration?: number; }) => {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <motion.span>{prefix}{Math.round(display).toLocaleString('en-IN')}{suffix}</motion.span>;
};
