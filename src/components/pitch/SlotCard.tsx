"use client";

import React from 'react';

type SlotStatus = 'available' | 'held' | 'booked' | 'blocked' | 'event';

interface SlotCardProps {
  timeLabel: string; // e.g., 14:00
  price?: number;
  status?: SlotStatus;
  expiresAt?: any; // Firestore Timestamp or millis
  onClick?: () => void;
}

const statusClasses: Record<SlotStatus, string> = {
  available: 'bg-white dark:bg-gray-800 border-green-400 text-gray-800 dark:text-gray-200',
  held: 'bg-gray-50 border-gray-300 text-gray-500',
  booked: 'bg-red-50 border-red-400 text-red-700',
  blocked: 'bg-gray-100 border-gray-300 text-gray-500',
  event: 'bg-purple-50 border-purple-400 text-purple-700',
};

export default function SlotCard({ timeLabel, price, status = 'available', expiresAt, onClick }: SlotCardProps) {
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
      className={`w-full p-3 rounded-lg border flex items-center justify-between gap-2 ${cls} hover:shadow-sm active:scale-95 transition-all ${disabled ? 'opacity-70' : ''}`}
    >
      <div className="flex flex-col items-start">
        <div className="text-sm font-semibold">{timeLabel}</div>
        <div className="text-xs opacity-80">{status}{status === 'held' && remaining ? ` — held ${remaining}` : ''}</div>
      </div>
      {typeof price === 'number' && <div className="text-sm font-medium">₦{price.toFixed(0)}</div>}
    </button>
  );
}
