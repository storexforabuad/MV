'use client';

import { ShieldCheck, MessageSquareX, Sparkles, Building2, CreditCard, Smartphone, Receipt, CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

interface CompassBenefitsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.4 } },
};

const PainSolutionCard = ({
    icon: Icon,
    iconColor,
    iconBg,
    pain,
    solution,
    title
}: {
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    pain: string;
    solution: string;
    title: string;
}) => (
    <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group"
    >
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${iconBg} transition-transform group-hover:scale-110 duration-300`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h3>
        </div>

        <div className="space-y-3">
            <div className="flex gap-3 items-start opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500">
                <div className="mt-1 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <X className="w-3 h-3 text-red-500" />
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-through decoration-red-400/50">{pain}</p>
            </div>

            <div className="flex gap-3 items-start bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-500/10">
                <div className="mt-1 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{solution}</p>
            </div>
        </div>
    </motion.div>
);

export const CompassBenefitsModal = ({ isOpen, onClose }: CompassBenefitsModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

                    {/* Header */}
                    <header className="relative z-10 flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                    Compass Business Hub 🧭
                                </h2>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-blue-500 dark:text-blue-400">
                                    Secured Influencer Business
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </header>

                    {/* Content */}
                    <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {/* Hero Section */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-3"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">The Ultimate Influencer Shield</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                    Stop Chasing, <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Start Dominating.</span>
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
                                    Compass 🧭 is the foundation for professional influencers. We handle the security so you can focus on the creativity.
                                </p>
                            </motion.div>

                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <PainSolutionCard
                                    icon={ShieldCheck}
                                    iconColor="text-blue-500"
                                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                                    title="No More Ghosting"
                                    pain="Chasing brands for weeks or getting ghosted after sending the deliverable."
                                    solution="Compass 🧭 Escrow holds the payment upfront. Once you deliver, you're guaranteed your payout."
                                />

                                <PainSolutionCard
                                    icon={MessageSquareX}
                                    iconColor="text-indigo-500"
                                    iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                                    title="End DM Fatigue"
                                    pain="Infinite back-and-forth DMs for prices, details, and manual bank transfers."
                                    solution="Send one link. Let them order through your professional storefront. No manual tracking needed."
                                />

                                <PainSolutionCard
                                    icon={Receipt}
                                    iconColor="text-purple-500"
                                    iconBg="bg-purple-100 dark:bg-purple-900/30"
                                    title="Verified Professionalism"
                                    pain="Arguments over delivery terms and 'where is the receipt?'"
                                    solution="Automated receipts, tracking numbers, and professional billing. You run a real business now."
                                />

                                <PainSolutionCard
                                    icon={CheckCircle2}
                                    iconColor="text-emerald-500"
                                    iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                                    title="Instant Payouts"
                                    pain="Waiting 30-60 days for corporate accounting to 'process' your invoice."
                                    solution="Funds are released immediately upon order completion. Your money, your schedule."
                                />
                            </motion.div>

                            {/* Partners/Trust Footer inside Content */}
                            <motion.div variants={itemVariants} className="pt-8 text-center space-y-6">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                                    Powered by Global Infrastructure
                                </p>
                                <div className="flex flex-wrap justify-center items-center gap-8 opacity-50 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg italic">
                                        Paystack
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg italic">
                                        Stripe
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg italic">
                                        OPay
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </main>

                    {/* Sticky CTA Footer */}
                    <footer className="relative z-10 p-5 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="max-w-3xl mx-auto">
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
                            >
                                Got it, Let's Scale my Business
                            </motion.button>
                        </div>
                    </footer>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
