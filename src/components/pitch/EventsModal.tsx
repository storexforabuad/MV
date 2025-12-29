"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

interface EventsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventsModal({ isOpen, onClose }: EventsModalProps) {
  const mockEvents = [
    { id: 1, name: 'Weekly League Championship', date: '2025-12-29', location: 'Lekki', participants: 24, entryFee: 5000, status: 'Upcoming' },
    { id: 2, name: 'New Year Tournament', date: '2026-01-05', location: 'V.I', participants: 32, entryFee: 8000, status: 'Upcoming' },
    { id: 3, name: 'Sunday Kickoff League', date: '2025-12-28', location: 'Ikoyi', participants: 18, entryFee: 3000, status: 'Today' },
    { id: 4, name: 'Elite Cup Finals', date: '2025-12-25', location: 'Surulere', participants: 28, entryFee: 10000, status: 'Completed' },
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
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Events & Tournaments</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Join the action and compete</p>
            </div>
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </motion.div>
          </header>

          {/* Main Content */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-hide">
            <div className="space-y-4 sm:space-y-6">
              {/* Upcoming Events */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Upcoming Events</h3>
                <div className="space-y-3">
                  {mockEvents.filter(e => e.status === 'Upcoming' || e.status === 'Today').map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{event.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.location} • {event.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                          event.status === 'Today'
                            ? 'bg-red-500 text-white'
                            : 'bg-purple-500 text-white'
                        }`}>
                          {event.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Participants</p>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">{event.participants}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Entry Fee</p>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">₦{event.entryFee.toLocaleString()}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-xs text-slate-600 dark:text-slate-400">Spots Left</p>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">{Math.floor(Math.random() * 8) + 3} spots</p>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg text-sm transition-all"
                      >
                        Register Now
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Past Events */}
              <div className="pb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Past Events</h3>
                <div className="space-y-3">
                  {mockEvents.filter(e => e.status === 'Completed').map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all opacity-75"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{event.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.location} • {event.date}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-400 text-white">Completed</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-slate-600 dark:text-slate-400">{event.participants} participated</p>
                        <p className="font-semibold text-slate-600 dark:text-slate-400">You participated</p>
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
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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
