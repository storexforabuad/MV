"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { User, X, LogOut, Bell, Lock } from 'lucide-react';
import Image from 'next/image';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const mockUser = {
    name: 'Chioma Okafor',
    email: 'chioma.okafor@email.com',
    phone: '+234 801 234 5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    memberSince: 'January 2024',
    stats: {
      totalBookings: 24,
      totalSpent: 480000,
      upcomingBookings: 3,
      averageRating: 4.8,
    },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Profile</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account</p>
            </div>
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </motion.div>
          </header>

          {/* Main Content */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {/* User Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={mockUser.avatar}
                  alt={mockUser.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover border-2 border-blue-400"
                />
                <div className="flex-1">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{mockUser.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Member since {mockUser.memberSince}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Email:</span> {mockUser.email}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Phone:</span> {mockUser.phone}
                </p>
              </div>
            </motion.div>

            {/* Stats Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Your Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700"
                >
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockUser.stats.totalBookings}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Bookings</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700"
                >
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₦{(mockUser.stats.totalSpent / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Spent</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700"
                >
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockUser.stats.upcomingBookings}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Upcoming</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-bold text-yellow-500">{mockUser.stats.averageRating}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Rating</p>
                </motion.div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Settings</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-left"
                >
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">Notifications</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Manage your alerts</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-left"
                >
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">Privacy & Security</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Control your privacy</p>
                  </div>
                </motion.button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto space-y-3">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
              <motion.button
                className="w-full flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold py-3 rounded-xl transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
