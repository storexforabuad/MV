'use client';
import { Moon, Sparkles, Star, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Ramadan 2026 Events
                                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Special fairs, pop-ups & networking</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 flex items-center justify-center shadow-lg border border-indigo-500/30">
                            <Moon className="w-6 h-6 text-amber-400" />
                        </div>
                    </header>

                    {/* --- Main Scrollable Content --- */}
                    <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                        <div className="flex flex-col items-center justify-center text-center py-6">
                            {/* Ramadan Banner */}
                            <div className="relative w-full aspect-[16/9] max-w-2xl mx-auto mb-8 rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/20 group">
                                <Image
                                    src="/images/events/ramadan_2026.png"
                                    alt="Ramadan 2026"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6 text-left">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Upcoming Event</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Ramadan Trade Fair 2026</h3>
                                </div>
                            </div>

                            <div className="max-w-md mx-auto space-y-6">
                                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Prepare your store for the most anticipated event of the year! Join thousands of vendors at the <strong>BizCon™ Ramadan 2026 Trade Fair & Pop-up Market</strong>.
                                </p>

                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Moon size={80} className="text-indigo-600 dark:text-indigo-400 rotate-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                                            Event Details Coming Soon
                                        </p>
                                        <p className="text-sm text-indigo-700/70 dark:text-indigo-300/70">
                                            We are finalizing the dates and venues. Stay tuned for registration details and early-bird vendor slots!
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Focus</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Fashion & Food</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                                            <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Season</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Ramadan 2026</p>
                                    </div>
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
                                className="w-full bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 hover:from-indigo-950 hover:to-slate-900 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] border border-indigo-500/30"
                                whileTap={{ scale: 0.98 }}
                            >
                                Noted
                            </motion.button>
                        </div>
                    </footer>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
