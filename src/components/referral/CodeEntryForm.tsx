'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CodeEntryForm() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            toast.error('Please enter your referral code');
            return;
        }

        setIsLoading(true);

        try {
            // Save the code path to localStorage for PWA redirect on future opens
            const dashboardPath = `/start/${code.toUpperCase().trim()}/dashboard`;
            localStorage.setItem('pwa_intended_path', dashboardPath);
            localStorage.setItem('pwa_path_timestamp', new Date().getTime().toString());

            // Navigate to dashboard
            router.push(dashboardPath);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to access dashboard');
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md space-y-6"
        >
            {/* Header */}
            <div className="space-y-3 text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-black text-white">Referral Dashboard</h1>
                <p className="text-sm text-slate-400">Enter your referral code to access your ambassador dashboard and track your earnings.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="code" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Referral Code
                    </label>
                    <input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g., MGL10"
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono text-lg tracking-widest"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !code.trim()}
                    className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            Opening Dashboard...
                        </>
                    ) : (
                        <>
                            Access Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            {/* Info section */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white">Don't have a code?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                    Your referral code was provided when you registered as an ambassador. Check your email or contact support if you need help finding it.
                </p>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">✓ Secure Access</span>
                <span>•</span>
                <span className="flex items-center gap-1">✓ Data Private</span>
                <span>•</span>
                <span className="flex items-center gap-1">✓ PWA Ready</span>
            </div>
        </motion.div>
    );
}
