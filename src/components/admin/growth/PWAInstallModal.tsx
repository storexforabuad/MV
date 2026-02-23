'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, Smartphone, Download, CheckCircle2 } from 'lucide-react';

interface PWAInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-8">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                                    <Download className="w-8 h-8 text-white" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Install Growth Portal</h2>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Native Experience</p>
                                </div>

                                <div className="w-full space-y-3">
                                    {/* Step 1 */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 flex-shrink-0">
                                            <Share className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <p className="text-left text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Tap the <span className="text-indigo-500">Share</span> icon in Safari's toolbar
                                        </p>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 flex-shrink-0">
                                            <PlusSquare className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <p className="text-left text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Select <span className="text-indigo-500">"Add to Home Screen"</span> from the menu
                                        </p>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 flex-shrink-0">
                                            <Smartphone className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <p className="text-left text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Tap <span className="text-indigo-500">Add</span> to install it on your device
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
