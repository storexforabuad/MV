'use client';
import { CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EventsModal = ({ isOpen, onClose }: EventsModalProps) => {
    const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    initial="hidden" animate="visible" exit="exit"
                    variants={modalVariants}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                >
                    {/* --- Header --- */}
                    <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                Bizcon Events
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming events & fairs</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 flex items-center justify-center shadow-lg">
                            <CalendarDays className="w-6 h-6 text-white" />
                        </div>
                    </header>

                    {/* --- Main Scrollable Content --- */}
                    <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                        <div className="flex flex-col items-center justify-center text-center py-12">
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30 mb-6">
                                <CalendarDays className="h-12 w-12 text-pink-600 dark:text-pink-400" aria-hidden="true" />
                            </div>

                            <div className="max-w-md mx-auto space-y-6">
                                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Stay tuned for upcoming Bizcon Online and offline events! This is where we will announce Trade Fairs, Pop-ups, Funfairs, Networking Events, and more.
                                </p>

                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        No events scheduled at the moment.
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Check back later for updates!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* --- Footer --- */}
                    <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
                        <div className="relative max-w-5xl mx-auto">
                            <motion.button
                                onClick={onClose}
                                className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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
};
