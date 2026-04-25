import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props extends HTMLMotionProps<'div'> {
  color?: 'cream' | 'lime' | 'purple' | 'orange' | 'ink' | 'white';
  tilt?: number;
  hover?: boolean;
}

const colorMap = {
  cream: 'bg-cream',
  lime: 'bg-lime',
  purple: 'bg-purple',
  orange: 'bg-orange text-white',
  ink: 'bg-ink text-cream',
  white: 'bg-card',
};

export const BrutalCard = ({ color = 'white', tilt = 0, hover = true, className, children, ...rest }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.4 }}
    whileHover={hover ? { y: -4, x: -4, boxShadow: '10px 10px 0 hsl(var(--ink))' } : undefined}
    style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    className={cn('brutal-border brutal-shadow rounded-2xl p-5', colorMap[color], className)}
    {...rest}
  >
    {children}
  </motion.div>
);
