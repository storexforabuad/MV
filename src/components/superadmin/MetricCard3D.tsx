'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MetricCard3DProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: ReactNode;
    color: 'purple' | 'orange' | 'blue' | 'emerald';
}

const colorMap = {
    purple: {
        bg: 'bg-indigo-50',
        iconBg: 'bg-indigo-600',
        shadow: 'shadow-indigo-100',
        border: 'border-indigo-100/50',
        text: 'text-indigo-600'
    },
    orange: {
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-500',
        shadow: 'shadow-orange-100',
        border: 'border-orange-100/50',
        text: 'text-orange-600'
    },
    blue: {
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-500',
        shadow: 'shadow-blue-100',
        border: 'border-blue-100/50',
        text: 'text-blue-600'
    },
    emerald: {
        bg: 'bg-emerald-50',
        iconBg: 'bg-emerald-500',
        shadow: 'shadow-emerald-100',
        border: 'border-emerald-100/50',
        text: 'text-emerald-600'
    }
};

export default function MetricCard3D({ title, value, subValue, icon, color }: MetricCard3DProps) {
    const theme = colorMap[color];

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`p-6 bg-white squircle-32 shadow-lg ${theme.shadow} border-2 ${theme.border} relative overflow-hidden group h-full`}
        >
            {/* 3D Visual Accent */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${theme.bg} rounded-full group-hover:scale-125 transition-transform duration-700 blur-xl`} />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                        {icon}
                    </div>
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">{title}</h3>
                </div>

                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
                        {subValue && (
                            <span className={`font-bold text-sm ${theme.text}`}>{subValue}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative Line Decor */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-50" />
        </motion.div>
    );
}
