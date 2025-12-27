"use client";

import { motion } from 'framer-motion';
import { Calendar, Heart, Trophy, User } from 'lucide-react';

interface HorizontalActionBarProps {
  onOpenModal: (modal: 'bookings' | 'favourites' | 'events' | 'profile') => void;
}

export default function HorizontalActionBar({ onOpenModal }: HorizontalActionBarProps) {
  const buttons = [
    { id: 'bookings', label: 'Bookings', icon: Calendar, color: 'from-teal-500 to-cyan-500' },
    { id: 'favourites', label: 'Favourites', icon: Heart, color: 'from-red-500 to-pink-500' },
    { id: 'events', label: 'Events', icon: Trophy, color: 'from-purple-500 to-indigo-500' },
    { id: 'profile', label: 'Profile', icon: User, color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 md:pb-6 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="flex gap-1.5 md:gap-3 lg:gap-4 px-2 py-2 md:py-3 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl pointer-events-auto"
      >
        {buttons.map((button, index) => {
          const Icon = button.icon;
          return (
            <motion.button
              key={button.id}
              onClick={() => onOpenModal(button.id as any)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br ${button.color} flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all active:scale-95`}
              title={button.label}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
