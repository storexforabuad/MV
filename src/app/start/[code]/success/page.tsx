'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Store, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import InstallPrompt from '@/components/InstallPrompt';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams?.get('storeId') || '';

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] opacity-30" />
            </div>

            <div className="relative z-10 max-w-md w-full text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 relative mx-auto w-64 h-48"
                >
                    <Image
                        src="/images/start-success.png"
                        alt="Success"
                        fill
                        className="object-contain"
                        priority
                    />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-black tracking-tight mb-4"
                >
                    You're Live!
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-400 font-medium mb-10 leading-relaxed"
                >
                    Your store has been created successfully. You can now start accepting payments immediately.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                >
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <InstallPrompt storeId={storeId} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin" className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        <Link href="/" className="bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            View Store
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
