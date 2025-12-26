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
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 px-2 py-1">
        {days.map((d) => {
          const iso = formatDateISO(d);
          const isSelected = selectedDate === iso;
          const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
          const dayNum = d.getDate();
          return (
            <button
              key={iso}
              onClick={() => onSelectDate?.(iso)}
              className={`min-w-[72px] flex flex-col items-center justify-center p-3 rounded-lg border ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-slate-700'}`}
            >
              <div className="text-xs opacity-80">{weekday}</div>
              <div className="text-lg font-bold">{dayNum}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
