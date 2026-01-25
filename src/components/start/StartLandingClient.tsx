'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Star, Zap, ShieldCheck, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface StartLandingClientProps {
    referralCode?: string;
    ambassadorName?: string;
}

export default function StartLandingClient({ referralCode, ambassadorName }: StartLandingClientProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isReferral = !!referralCode;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-emerald-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white fill-current" />
                        </div>
                        <span className="text-lg font-black tracking-tight">Atlas</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            Login
                        </Link>
                        {!isReferral && (
                            <Link href="/register" className="bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide hover:scale-105 transition-transform">
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[120px] opacity-50" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Text Content */}
                        <div className="flex-1 text-center lg:text-left">
                            {isReferral && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-8"
                                >
                                    <Star className="w-4 h-4 text-emerald-500 fill-current" />
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                        referred by: {referralCode}
                                    </span>
                                </motion.div>
                            )}

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.1]"
                            >
                                Start Your <br />
                                <span className="text-emerald-500">Business</span> <br />
                                with Atlas.
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 mb-10 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed"
                            >
                                The premium platform for modern commerce. Launch your online store in minutes and start selling to the world.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col items-center lg:items-start gap-6"
                            >
                                <Link
                                    href={isReferral ? `/start/${referralCode}/register` : '/register'}
                                    className="group bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-3"
                                >
                                    Claim Free Store
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <div className="flex items-center gap-3 text-emerald-500 font-black text-sm uppercase tracking-widest">
                                    <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    100% Discount Applied
                                </div>
                            </motion.div>
                        </div>

                        {/* Visual Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="flex-1 w-full max-w-[600px] lg:max-w-none relative"
                        >
                            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                                <Image
                                    src="/images/start-hero.png"
                                    alt="Atlas Storefront Interface"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                                {/* Floating Badge */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl flex items-center gap-3"
                                >
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live Preview</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Zap}
                            title="Zero Upfront Cost"
                            description={isReferral ? (
                                <span>
                                    Start for free today. No hidden fees. <span className="line-through opacity-50">₦55,000</span> registration fee waived.
                                </span>
                            ) : "Simple one-time payment to get full access to the platform forever."}
                        />
                        <FeatureCard
                            icon={Globe}
                            title="4.5% Commission"
                            description="We only make money when you do. Fair, transparent pricing for every transaction."
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Instant Subaccount"
                            description="Get paid directly to your bank account. Automated splits, zero delays."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black mb-3">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {description}
            </p>
        </div>
    );
}
