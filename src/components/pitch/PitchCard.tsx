"use client";

import React from 'react';

interface PitchProps {
  id: string;
  name?: string;
  imageUrl?: string;
  image?: string;
  pricePerSlot?: number;
  type?: string;
  surface?: string;
  capacity?: number;
  badges?: string[];
  images?: string[];
}

interface Props {
  pitch: PitchProps;
  onBook: (p: PitchProps) => void;
}

// Note: this component uses `next/image`. Confirmed project uses Next.js; if `next/image` is unavailable,
// replace with a plain <img> and onError fallback.
export default function PitchCard({ pitch, onBook }: Props) {
  const src = pitch.images && pitch.images.length > 0 ? pitch.images[0] : (pitch.imageUrl || pitch.image || '/images/pitch-fallback.svg');

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (!target.dataset.fallback) {
      target.src = '/images/pitch-fallback.svg';
      target.dataset.fallback = '1';
    }
  };

  return (
    <div className="p-1 rounded-3xl bg-gradient-to-r from-indigo-300 via-pink-200 to-yellow-200">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1">
        <div className="w-full h-44 sm:h-48 md:h-56 relative">
          <img
            src={src}
            alt={pitch.name || 'Pitch image'}
            className="w-full h-full object-cover"
            onError={handleImgError}
            draggable={false}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{pitch.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {pitch.type && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">{pitch.type}</span>}
                {pitch.surface && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">{pitch.surface}</span>}
                {pitch.capacity !== undefined && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">{pitch.capacity} players</span>}
              </div>
            </div>

            <div className="ml-4 flex-shrink-0 text-right">
              <div className="text-sm text-gray-500">Per slot</div>
              <div className="mt-1 text-2xl font-extrabold text-indigo-600">₦{(pitch.pricePerSlot || 0).toFixed(0)}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              {(pitch.badges || []).slice(0, 3).map((b, i) => (
                <span key={i} className="inline-block text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-white/40">{b}</span>
              ))}
            </div>

            <button
              onClick={() => onBook(pitch)}
              className="ml-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm shadow-sm hover:scale-[1.01] active:scale-95 focus:outline-none"
            >
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
