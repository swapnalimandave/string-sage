import { motion } from 'framer-motion';

export const ScribbleUnderline = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 20" className={className} fill="none" preserveAspectRatio="none">
    <motion.path
      d="M5 12 Q 50 2, 100 10 T 195 8"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
  </svg>
);

export const ArrowDoodle = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 60" className={className} fill="none">
    <motion.path
      d="M5 30 Q 30 5, 60 30 T 90 35 M85 28 L92 36 L82 38"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
      transition={{ duration: 1.2 }}
    />
  </svg>
);

export const StarDoodle = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none">
    <path d="M20 4 L24 16 L36 16 L26 24 L30 36 L20 28 L10 36 L14 24 L4 16 L16 16 Z"
      stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

export const CircleDoodle = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 100 60" className={className} fill="none">
    <motion.ellipse cx="50" cy="30" rx="44" ry="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      strokeDasharray="4 0"
      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
      transition={{ duration: 1.2 }}
    />
  </svg>
);

export const SparkleDoodle = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 30 30" className={className} fill="none">
    <path d="M15 2 V12 M15 18 V28 M2 15 H12 M18 15 H28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
