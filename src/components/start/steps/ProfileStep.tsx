'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { geography } from '@/config/geography';

interface ProfileStepProps {
    data: any;
    updateData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function ProfileStep({ data, updateData, onNext, onBack }: ProfileStepProps) {
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const newErrors: any = {};
        if (!data.businessName) newErrors.businessName = 'Business Name is required';
        if (!data.whatsapp) newErrors.whatsapp = 'WhatsApp number is required';
        if (!data.country) newErrors.country = 'Country is required';
        if (!data.state) newErrors.state = 'State is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            onNext();
        }
    };

    const selectedCountry = geography.find(c => c.name === data.country);

    return (
        <div className="flex flex-col h-full">
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">Tell us about your business.</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                    This info will be displayed on your store.
                </p>
            </div>

            <div className="space-y-5 flex-1">
                <Input
                    label="Business Name"
                    value={data.businessName}
                    onChange={(e: any) => updateData({ businessName: e.target.value })}
                    placeholder="e.g. My Awesome Store"
                    error={errors.businessName}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="WhatsApp Number"
                        value={data.whatsapp}
                        onChange={(e: any) => updateData({ whatsapp: e.target.value })}
                        placeholder="080..."
                        type="tel"
                        error={errors.whatsapp}
                    />
                    <Input
                        label="Instagram (Optional)"
                        value={data.instagram}
                        onChange={(e: any) => updateData({ instagram: e.target.value })}
                        placeholder="@handle"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Country</label>
                        <div className="relative">
                            <select
                                value={data.country}
                                onChange={(e) => updateData({ country: e.target.value, state: '' })}
                                className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 font-medium outline-none transition-colors appearance-none ${errors.country ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500'
                                    }`}
                            >
                                <option value="">Select Country</option>
                                {geography.map((c) => (
                                    <option key={c.name} value={c.name}>
                                        {c.flag} {c.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">State</label>
                        <div className="relative">
                            <select
                                value={data.state}
                                onChange={(e) => updateData({ state: e.target.value })}
                                disabled={!data.country}
                                className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 font-medium outline-none transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.state ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500'
                                    }`}
                            >
                                <option value="">Select State</option>
                                {selectedCountry?.states.map((s) => (
                                    <option key={s.name} value={s.name}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-black text-sm">Physical Shop?</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Do you have a location?</span>
                    </div>
                    <button
                        onClick={() => updateData({ hasPhysicalShop: !data.hasPhysicalShop })}
                        className={`w-14 h-7 rounded-full transition-all relative flex-shrink-0 ${data.hasPhysicalShop ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                    >
                        <div
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${data.hasPhysicalShop ? 'left-8' : 'left-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={handleNext}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

function Input({ label, error, ...props }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                {label}
                {error && <span className="text-rose-500">{error}</span>}
            </label>
            <input
                className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 font-medium outline-none transition-colors ${error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500'
                    }`}
                {...props}
            />
        </div>
    );
}
