'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="p-2 rounded-lg hover:bg-card-hover active:bg-card-hover 
        text-text-primary transition-colors touch-manipulation 
        focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]
        active:scale-95"
      aria-label="Go back"
    >
      <ArrowLeft className="w-6 h-6" />
    </button>
  );
}
