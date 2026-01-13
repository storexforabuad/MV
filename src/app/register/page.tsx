'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    User, Building2, Phone, Mail, MapPin, Briefcase,
    CheckCircle2, ChevronRight, ChevronLeft, Loader2,
    Sparkles, CreditCard, Upload, Store, ShoppingBag,
    UtensilsCrossed, Shirt, Car, Fish, Globe, Laptop,
    PartyPopper, GraduationCap
} from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TIER_DETAILS, SubscriptionTier } from '@/types/subscription';
import { geography } from '@/config/geography';

// --- Types ---

type StoreType =
    | 'general'
    | 'restaurant'
    | 'fashion'
    | 'livestock'
    | 'automotive'
    | 'social-commerce'
    | 'digital-products'
    | 'consultancy'
    | 'events';

interface RegistrationData {
    // CEO Details
    ceoName: string;
    ceoPhone: string;
    ceoEmail: string;
    ceoImage: File | null;
    ceoImageUrl?: string;

    // Business Details
    businessName: string;
    businessPhone: string; // WhatsApp
    businessDescription: string;
    country: string;
    state: string;

    // Store Config
    storeType: StoreType;

    // Subscription
    subscriptionTier: SubscriptionTier;
}

const STORE_TYPES: { id: StoreType; label: string; icon: any; description: string; color: string }[] = [
    {
        id: 'general',
        label: 'General Store',
        icon: ShoppingBag,
        description: 'Perfect for retail, supermarkets, and general merchandise.',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'restaurant',
        label: 'Restaurant',
        icon: UtensilsCrossed,
        description: 'For food vendors, restaurants, and fast food chains.',
        color: 'from-orange-500 to-red-500'
    },
    {
        id: 'fashion',
        label: 'Fashion',
        icon: Shirt,
        description: 'Clothing brands, boutiques, and fashion designers.',
        color: 'from-pink-500 to-rose-500'
    },
    {
        id: 'livestock',
        label: 'Livestock',
        icon: Fish,
        description: 'Fishery, poultry, and agricultural products.',
        color: 'from-green-500 to-emerald-500'
    },
    {
        id: 'automotive',
        label: 'Automotive',
        icon: Car,
        description: 'Car dealerships, spare parts, and auto services.',
        color: 'from-slate-500 to-gray-500'
    },
    {
        id: 'social-commerce',
        label: 'Social Commerce',
        icon: Globe,
        description: 'Sell directly on social media with a unified link.',
        color: 'from-violet-500 to-purple-500'
    },
    {
        id: 'digital-products',
        label: 'Digital Products',
        icon: Laptop,
        description: 'E-books, courses, software, and digital assets.',
        color: 'from-indigo-500 to-blue-500'
    },
    {
        id: 'consultancy',
        label: 'Consultancy',
        icon: GraduationCap,
        description: 'Professional services, coaching, and experts.',
        color: 'from-teal-500 to-emerald-500'
    },
    {
        id: 'events',
        label: 'Events',
        icon: PartyPopper,
        description: 'Event planning, ticketing, and management.',
        color: 'from-yellow-500 to-amber-500'
    },
];

// --- Components ---

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
            <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${i + 1 === currentStep
                    ? 'w-8 bg-gradient-to-r from-emerald-400 to-green-500'
                    : i + 1 < currentStep
                        ? 'w-2 bg-green-500'
                        : 'w-2 bg-slate-700'
                    }`}
            />
        ))}
    </div>
);

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
    }, [step]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<RegistrationData>({
        ceoName: '',
        ceoPhone: '',
        ceoEmail: '',
        ceoImage: null,
        businessName: '',
        businessPhone: '',
        businessDescription: '',
        country: 'Nigeria',
        state: '',
        storeType: 'general',
        subscriptionTier: 'pro'
    });

    const handleInputChange = (field: keyof RegistrationData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, ceoImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailError, setEmailError] = useState('');

    const handleEmailSubmit = () => {
        if (!formData.ceoEmail || !formData.ceoEmail.includes('@')) {
            setEmailError('Please enter a valid email address');
            return;
        }
        setShowEmailModal(false);
        handlePayment();
    };

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // 1. Upload Image if exists
            let ceoImageUrl = '';
            if (formData.ceoImage) {
                const storageRef = ref(storage, `registrations/${Date.now()}_${formData.ceoImage.name}`);
                await uploadBytes(storageRef, formData.ceoImage);
                ceoImageUrl = await getDownloadURL(storageRef);
            }

            // 2. Initialize Paystack
            const tierDetails = TIER_DETAILS[formData.subscriptionTier as keyof typeof TIER_DETAILS];
            const amount = tierDetails.price * 100; // Convert to kobo

            const paystackConfig = {
                key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
                email: formData.ceoEmail,
                amount: amount,
                currency: 'NGN',
                ref: `reg_${Date.now()}`,
                metadata: {
                    custom_fields: [
                        { display_name: "Business Name", variable_name: "business_name", value: formData.businessName },
                        { display_name: "Store Type", variable_name: "store_type", value: formData.storeType },
                        { display_name: "Tier", variable_name: "tier", value: formData.subscriptionTier }
                    ]
                },
                onClose: () => setIsLoading(false),
                callback: (response: any) => {
                    (async () => {
                        // 3. Save Registration to Firestore
                        await addDoc(collection(db, 'registrations'), {
                            ...formData,
                            ceoImage: null, // Don't save File object
                            ceoImageUrl,
                            amountPaid: tierDetails.price,
                            paymentReference: response.reference,
                            status: 'pending',
                            createdAt: serverTimestamp()
                        });

                        setStep(5); // Success Step
                        setIsLoading(false);
                    })();
                }
            };

            // @ts-ignore
            const handler = window.PaystackPop.setup(paystackConfig);
            handler.openIframe();

        } catch (error) {
            console.error('Registration error:', error);
            alert('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    // --- Step Content ---

    const renderStep1_Welcome = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
        >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/20 mb-8">
                <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Join the Future<br />of Commerce
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
                Create your premium online store in minutes.
                <br />
                <span className="text-emerald-400 font-bold">Bizapp (Biz+App)™</span> - Your Business, All in One App.
            </p>
            <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10 mt-8"
            >
                Get Started
            </button>
        </motion.div>
    );

    const renderStep2_Details = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Tell us about you</h2>
                <p className="text-slate-400 text-sm">We need some basic details to set up your profile.</p>
            </div>

            {/* Image Upload */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 mx-auto rounded-full border-2 border-dashed border-slate-700 hover:border-emerald-500 transition-colors flex items-center justify-center cursor-pointer overflow-hidden relative group bg-slate-900/50"
            >
                {imagePreview ? (
                    <Image src={imagePreview} alt="Logo" fill className="object-cover" />
                ) : (
                    <div className="text-center p-2">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-xs text-slate-500 font-medium">Upload Logo</span>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Business Name</label>
                        <input
                            value={formData.businessName}
                            onChange={(e) => handleInputChange('businessName', e.target.value)}
                            placeholder="e.g. My Awesome Store"
                            className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Business WhatsApp</label>
                        <input
                            value={formData.businessPhone}
                            onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                            placeholder="e.g. 08012345678"
                            type="tel"
                            className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={() => {
                    if (formData.businessName && formData.businessPhone) setStep(3);
                    else alert('Please fill in all required fields');
                }}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold mt-8 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
            >
                Continue
            </button>
        </motion.div>
    );

    const renderStep3_StoreType = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Choose your niche</h2>
                <p className="text-slate-400 text-sm">Select the category that best fits your business.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4">
                {STORE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.storeType === type.id;
                    return (
                        <div
                            key={type.id}
                            onClick={() => handleInputChange('storeType', type.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${isSelected
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 shadow-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-white font-bold text-sm mb-1">{type.label}</h3>
                            <p className="text-[10px] text-slate-400 leading-tight">{type.description}</p>

                            {isSelected && (
                                <div className="absolute top-3 right-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => setStep(4)}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold mt-4 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
            >
                Continue
            </button>
        </motion.div>
    );

    const renderStep4_Subscription = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-24">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Select a Plan</h2>
                <p className="text-slate-400 text-sm">Choose the perfect plan to grow your business.</p>
            </div>

            <div className="space-y-4">
                {(['basic', 'pro', 'promax'] as const).map((tier) => {
                    const details = TIER_DETAILS[tier];
                    const isSelected = formData.subscriptionTier === tier;
                    const isProMax = tier === 'promax';

                    return (
                        <div
                            key={tier}
                            onClick={() => handleInputChange('subscriptionTier', tier)}
                            className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected
                                ? isProMax ? 'border-amber-500 bg-amber-500/10' : 'border-emerald-500 bg-emerald-500/10'
                                : 'border-slate-800 bg-slate-900/40'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className={`text-xl font-black ${isProMax ? 'text-amber-500' : 'text-white'}`}>
                                        {details.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">{details.description}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white">₦{details.price.toLocaleString()}</span>
                                    <span className="text-xs text-slate-500 block">/week</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isProMax ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                                    }`}>
                                    {typeof details.productLimit === 'number' ? `${details.productLimit} Products` : details.productLimit}
                                </div>
                            </div>

                            {isSelected && (
                                <div className="absolute top-4 right-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isProMax ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );

    // ... (keep existing code)

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-md mx-auto h-dvh flex flex-col">
                {/* Header */}
                <header className="flex-none flex justify-between items-center p-6 relative z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="font-black text-white text-lg">B</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">Bizapp</span>
                    </div>
                    {step > 1 && step < 5 && (
                        <button
                            onClick={() => setStep(prev => prev - 1)}
                            className="w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-800"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </header>

                {/* Main Content */}
                <main ref={mainRef} className="flex-1 overflow-y-auto px-6 pb-6 relative z-10 scrollbar-hide">
                    <div className="min-h-full flex flex-col justify-center">
                        {step > 1 && step < 5 && <StepIndicator currentStep={step - 1} totalSteps={3} />}

                        <AnimatePresence mode="wait">
                            {step === 1 && renderStep1_Welcome()}
                            {step === 2 && renderStep2_Details()}
                            {step === 3 && renderStep3_StoreType()}
                            {step === 4 && renderStep4_Subscription()}
                            {step === 5 && renderStep5_Success()}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Footer */}
                {step === 1 && (
                    <footer className="flex-none py-4 text-center text-[10px] text-slate-600 relative z-10 bg-black/50 backdrop-blur-sm">
                        <p>© {new Date().getFullYear()} Bizapp (Biz+App)™. All rights reserved.</p>
                    </footer>
                )}

                {/* Sticky Pay Button for Step 4 */}
                {step === 4 && (
                    <div className="flex-none p-6 pt-2 bg-gradient-to-t from-black via-black to-transparent relative z-20">
                        <button
                            onClick={() => setShowEmailModal(true)}
                            disabled={isLoading}
                            className="w-full py-4 bg-white text-slate-900 rounded-xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                            Pay & Register
                        </button>
                    </div>
                )}
            </div>

            {/* Email Modal */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEmailModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <Mail className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-center text-white mb-2">One Last Thing!</h3>
                            <p className="text-slate-400 text-center text-sm mb-8">
                                Where should we send your receipt and login details?
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <input
                                        value={formData.ceoEmail}
                                        onChange={(e) => {
                                            handleInputChange('ceoEmail', e.target.value);
                                            setEmailError('');
                                        }}
                                        placeholder="name@example.com"
                                        type="email"
                                        autoFocus
                                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-center placeholder:text-slate-600"
                                    />
                                    {emailError && (
                                        <p className="text-red-500 text-xs text-center mt-2">{emailError}</p>
                                    )}
                                </div>

                                <button
                                    onClick={handleEmailSubmit}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
