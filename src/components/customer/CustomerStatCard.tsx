'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface CustomerStatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  subValue?: string;
  gradient: string;
  onClick: () => void;
}

export function CustomerStatCard({ icon, value, label, subValue, gradient, onClick }: CustomerStatCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full h-40 rounded-2xl p-4 flex flex-col items-center justify-center text-white shadow-lg transition-all ${gradient}`}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-white/20 rounded-full p-3 mb-2">{icon}</div>
      <span className="text-4xl font-bold">{value}</span>
      {subValue && <span className="text-sm font-semibold opacity-80">{subValue}</span>}
      <span className="text-sm font-medium mt-1 opacity-90">{label}</span>
    </motion.button>
  );
}
