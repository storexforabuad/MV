export default function TickIcon({ className = 'w-32 h-32' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-hidden="false">
      <circle cx="60" cy="60" r="58" fill="#ECFDF5" stroke="#10B981" strokeWidth="4" />
      <path d="M36 62l10 10 34-34" stroke="#059669" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
