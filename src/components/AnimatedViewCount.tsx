'use client';

import { useEffect, useState } from 'react';
import { EyeIcon } from 'lucide-react';

interface AnimatedViewCountProps {
  value: number;
  duration?: number; // animation duration in seconds
  className?: string;
}

export default function AnimatedViewCount({ value, duration = 1, className }: AnimatedViewCountProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }
    setCount(0);
    // Calculate animation duration based on value
    const msDuration = duration * 1000;
    const steps = 60;
    const increment = value / steps;
    const stepDuration = msDuration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);
    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${className || ''}`}
      aria-label="View count">
      <EyeIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      <span>{count}</span>
    </div>
  );
}
