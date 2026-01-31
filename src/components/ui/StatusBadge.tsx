'use client';

export default function StatusBadge({ variant = 'info', children }: { variant?: 'active' | 'pending' | 'info' | 'warning', children: React.ReactNode }) {
  const base = 'px-2 py-0.5 rounded-full text-xs font-black inline-flex items-center gap-2';
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    warning: 'bg-rose-100 text-rose-700',
    info: 'bg-slate-100 text-slate-700'
  };

  return (
    <span className={`${base} ${styles[variant] || styles.info}`} role="status" aria-live="polite">
      {children}
    </span>
  );
}
