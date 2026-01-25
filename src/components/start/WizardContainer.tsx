'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryStep from './steps/CategoryStep';
import ProfileStep from './steps/ProfileStep';
import PayoutStep from './steps/PayoutStep';
import SummaryStep from './steps/SummaryStep';
import { Zap } from 'lucide-react';

interface WizardContainerProps {
    referralCode: string;
}

export type WizardData = {
    category: string;
    businessName: string;
    whatsapp: string;
    instagram: string;
    email: string;
    country: string;
    state: string;
    hasPhysicalShop: boolean;
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
};

const initialData: WizardData = {
    category: '',
    businessName: '',
    whatsapp: '',
    instagram: '',
    email: '',
    country: 'Nigeria',
    state: 'Lagos',
    hasPhysicalShop: false,
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankCode: '',
};

export default function WizardContainer({ referralCode }: WizardContainerProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardData>(initialData);
    const [direction, setDirection] = useState(0);

    const updateData = (newData: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...newData }));
    };

    const nextStep = () => {
        setDirection(1);
        setStep((prev) => Math.min(prev + 1, 4));
    };

    const prevStep = () => {
        setDirection(-1);
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-emerald-500/30 flex flex-col">
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white fill-current" />
                    </div>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200 dark:bg-slate-800'
                                }`}
                        />
                    ))}
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 pb-12">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex-1 flex flex-col"
                    >
                        {step === 1 && (
                            <CategoryStep
                                data={data}
                                updateData={updateData}
                                onNext={nextStep}
                            />
                        )}
                        {step === 2 && (
                            <ProfileStep
                                data={data}
                                updateData={updateData}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        )}
                        {step === 3 && (
                            <PayoutStep
                                data={data}
                                updateData={updateData}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        )}
                        {step === 4 && (
                            <SummaryStep
                                data={data}
                                referralCode={referralCode}
                                onBack={prevStep}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
