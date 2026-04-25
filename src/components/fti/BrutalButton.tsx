import * as React from 'react';
import { cn } from '@/lib/utils';

type Color = 'lime' | 'purple' | 'orange' | 'ink' | 'cream';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: Color;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<Color, string> = {
  lime: 'bg-lime text-ink',
  purple: 'bg-purple text-ink',
  orange: 'bg-orange text-white',
  ink: 'bg-ink text-cream',
  cream: 'bg-cream text-ink',
};

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

export const BrutalButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ color = 'lime', size = 'md', className, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn('brutal-btn', colorMap[color], sizeMap[size], className)}
      {...rest}
    >
      {children}
    </button>
  ),
);
BrutalButton.displayName = 'BrutalButton';
