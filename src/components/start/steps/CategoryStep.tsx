'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Utensils, Smartphone, Shirt, Home, Briefcase, MoreHorizontal, Car, Laptop, GraduationCap, PartyPopper, Building2, Sparkles } from 'lucide-react';

interface CategoryStepProps {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
}

const categories = [
    { id: 'general', name: 'General Store', icon: ShoppingBag, color: 'bg-blue-500' },
    { id: 'restaurant', name: 'Restaurant', icon: Utensils, color: 'bg-orange-500' },
    { id: 'fashion', name: 'Fashion', icon: Shirt, color: 'bg-pink-500' },
    { id: 'livestock', name: 'Livestock', icon: Home, color: 'bg-green-600' },
    { id: 'automotive', name: 'Automotive', icon: Car, color: 'bg-slate-500' },
    { id: 'electronics', name: 'Electronics', icon: Smartphone, color: 'bg-blue-400' },
    { id: 'real-estate', name: 'Real Estate', icon: Building2, color: 'bg-slate-700' },
    { id: 'artist', name: 'Artist', icon: Sparkles, color: 'bg-purple-500' },
    { id: 'beauty', name: 'Beauty', icon: Sparkles, color: 'bg-pink-400' },
    { id: 'home-services', name: 'Home Services', icon: Briefcase, color: 'bg-amber-600' },
    { id: 'digital-products', name: 'Digital Products', icon: Laptop, color: 'bg-indigo-500' },
];

export default function CategoryStep({ data, updateData, onNext }: CategoryStepProps) {
    const handleSelect = (id: string) => {
        updateData({ category: id });
        onNext();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">What are you selling?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Pick the category that best describes your business.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                {categories.map((cat, index) => {
                    const Icon = cat.icon;
                    return (
                        <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSelect(cat.id)}
                            className="group relative aspect-square rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all p-4 flex flex-col items-center justify-center gap-3 text-center shadow-sm hover:shadow-xl hover:scale-105"
                        >
                            <div className={`w-10 h-10 rounded-2xl ${cat.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-5 h-5 ${cat.color.replace('bg-', 'text-')}`} />
                            </div>
                            <span className="font-bold text-xs sm:text-sm">{cat.name}</span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
