'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutConfirmationModal({ isOpen, onClose, onConfirm }: LogoutConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden pointer-events-auto"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 flex flex-col items-center text-center">
                                {/* Icon */}
                                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                    <div className="w-14 h-14 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center relative">
                                        <LogOut className="w-7 h-7 text-red-600 dark:text-red-400" />
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    Leaving so soon?
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                    You'll need to whisper the secret ingredient to get back into the kitchen.
                                </p>

                                {/* Actions */}
                                <div className="flex flex-col w-full gap-3">
                                    <button
                                        onClick={onConfirm}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]"
                                    >
                                        Log Out
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
                                    >
                                        Stay here
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
