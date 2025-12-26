"use client";

import React from 'react';

type SlotStatus = 'available' | 'held' | 'booked' | 'blocked' | 'event';

interface SlotCardProps {
  timeLabel: string; // e.g., 14:00
  price?: number;
  status?: SlotStatus;
  isSelected?: boolean;
  expiresAt?: any; // Firestore Timestamp or millis
  onClick?: () => void;
}

const statusClasses: Record<SlotStatus, string> = {
  available: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 hover:shadow-md hover:border-emerald-400',
  held: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-200',
  booked: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200',
  blocked: 'bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
  event: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-200',
};

export default function SlotCard({ timeLabel, price, status = 'available', isSelected = false, expiresAt, onClick }: SlotCardProps) {
  const cls = statusClasses[status];
  const disabled = status !== 'available';

  const [remaining, setRemaining] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    let timer: any = null;

    function compute() {
      if (!expiresAt) { setRemaining(null); return }
      try {
        const ms = typeof expiresAt.toMillis === 'function' ? expiresAt.toMillis() - Date.now() : (Number(expiresAt) - Date.now());
        if (ms <= 0) {
          if (mounted) setRemaining(null);
          return;
        }
        const s = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        const label = `${m}:${String(sec).padStart(2, '0')}`;
        if (mounted) setRemaining(label);
      } catch (e) {
        if (mounted) setRemaining(null);
      }
    }

    compute();
    timer = setInterval(compute, 1000);
    return () => { mounted = false; clearInterval(timer) }
  }, [expiresAt]);

  return (
    <button
      onClick={() => !disabled && onClick?.()}
      disabled={disabled}
      aria-pressed={!disabled}
      className={`w-full p-3 rounded-xl border-2 flex flex-col items-start gap-1 font-medium transition-all ${cls} ${
        isSelected && !disabled
          ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-950 shadow-lg'
          : 'active:scale-95'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-lg font-bold">{timeLabel}</span>
        {isSelected && !disabled && <span className="text-sm">✓</span>}
      </div>
      <div className="text-xs opacity-75 font-normal">
        {status === 'available' && 'Available'}
        {status === 'held' && `Held ${remaining ? `(${remaining})` : ''}`}
        {status === 'booked' && 'Booked'}
        {status === 'blocked' && 'Blocked'}
        {status === 'event' && 'Event'}
      </div>
      {typeof price === 'number' && status === 'available' && (
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mt-1">₦{price.toFixed(0)}</span>
      )}
    </button>
  );
}
