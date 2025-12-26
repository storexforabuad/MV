"use client";

import React from 'react';

interface CalendarStripProps {
  startDate?: Date; // defaults to today
  selectedDate?: string; // YYYY-MM-DD
  onSelectDate?: (dateISO: string) => void;
}

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getWeekDays(start: Date) {
  const days: Date[] = [];
  const base = new Date(start);
  for (let i = 0; i < 7; i++) {
    const nd = new Date(base);
    nd.setDate(base.getDate() + i);
    days.push(nd);
  }
  return days;
}

export default function CalendarStrip({ startDate, selectedDate, onSelectDate }: CalendarStripProps) {
  const base = startDate ? new Date(startDate) : new Date();
  const days = getWeekDays(base);

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
      <style>{`
        .calendar-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .calendar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .calendar-scroll::-webkit-scrollbar-thumb {
          background: #14b8a6;
          border-radius: 2px;
          transition: background 0.3s ease;
        }
        .calendar-scroll::-webkit-scrollbar-thumb:hover {
          background: #0d9488;
        }
        /* Firefox */
        .calendar-scroll {
          scrollbar-color: #14b8a6 transparent;
          scrollbar-width: thin;
        }
      `}</style>
      <div className="calendar-scroll overflow-x-auto px-4 py-3 flex gap-2.5 scroll-smooth">
        {days.map((d) => {
          const iso = formatDateISO(d);
          const isSelected = selectedDate === iso;
          const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
          const dayNum = d.getDate();
          return (
            <button
              key={iso}
              onClick={() => onSelectDate?.(iso)}
              className={`min-w-[76px] flex flex-col items-center justify-center px-3 py-3 rounded-xl border-2 transition-all flex-shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white border-teal-600 shadow-lg shadow-teal-500/30 ring-2 ring-teal-300/50 dark:ring-teal-700/50'
                  : 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm'
              }`}
            >
              <div className="text-xs font-medium opacity-75">{weekday}</div>
              <div className="text-lg font-bold mt-1">{dayNum}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
