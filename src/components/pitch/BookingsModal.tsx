"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';

interface BookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingsModal({ isOpen, onClose }: BookingsModalProps) {
  const mockBookings = [
    { id: 1, pitchName: 'Pitch A', date: '2025-12-29', time: '14:00', duration: '1 hour', price: 25000, status: 'Confirmed' },
    { id: 2, pitchName: 'Pitch B', date: '2025-12-30', time: '16:00', duration: '1 hour', price: 25000, status: 'Confirmed' },
    { id: 3, pitchName: 'Pitch A', date: '2025-12-27', time: '11:00', duration: '1 hour', price: 25000, status: 'Completed' },
    { id: 4, pitchName: 'Pitch C', date: '2025-12-25', time: '09:00', duration: '1 hour', price: 25000, status: 'Completed' },
  ];

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
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">My Bookings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">View your upcoming and past bookings</p>
            </div>
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </motion.div>
          </header>

          {/* Main Content */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-hide">
            <div className="space-y-4 sm:space-y-6">
              {/* Upcoming Bookings */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Upcoming Bookings</h3>
                <div className="space-y-3">
                  {mockBookings.filter(b => b.status === 'Confirmed').map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-teal-200 dark:border-teal-800 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{booking.pitchName}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{booking.date} at {booking.time}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500 text-white whitespace-nowrap ml-2">Confirmed</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-slate-600 dark:text-slate-400">{booking.duration}</p>
                        <p className="font-semibold text-teal-600 dark:text-teal-400">₦{booking.price.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Past Bookings */}
              <div className="pb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Past Bookings</h3>
                <div className="space-y-3">
                  {mockBookings.filter(b => b.status === 'Completed').map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all opacity-75"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{booking.pitchName}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{booking.date} at {booking.time}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-400 text-white whitespace-nowrap ml-2">Completed</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-slate-600 dark:text-slate-400">{booking.duration}</p>
                        <p className="font-semibold text-slate-600 dark:text-slate-400">₦{booking.price.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative mt-auto flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
