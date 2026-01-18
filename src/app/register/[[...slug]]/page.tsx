'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Script from 'next/script';
import {
    User, Building2, Phone, Mail, MapPin, Briefcase,
    CheckCircle2, ChevronRight, ChevronLeft, Loader2,
    Sparkles, CreditCard, Upload, Store, ShoppingBag,
    UtensilsCrossed, Shirt, Car, Fish, Globe, Laptop,
    PartyPopper, GraduationCap, Bot, Tag, ArrowRight,
    MessageCircle, Smartphone, Wrench, Instagram, Zap, ChevronDown, Clock
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImageToCloudinary } from '@/lib/cloudinaryClient';
import { compressImage } from '@/utils/imageCompression';
import { TIER_DETAILS, SubscriptionTier, calculateTrialEndDate } from '@/types/subscription';
import { geography } from '@/config/geography';

// --- Types ---

type StoreType =
    | 'general'
    | 'restaurant'
    | 'fashion'
    | 'livestock'
    | 'automotive'
    | 'electronics'
    | 'real-estate'
    | 'artist'
    | 'beauty'
    | 'home-services'
    | 'digital-products';

interface RegistrationData {
    // CEO Details
    ceoName: string;
    ceoPhone: string;
    ceoEmail: string;
    logoImage: File | null;
    logoUrl?: string;

    // Business Details
    businessName: string;
    businessPhone: string; // WhatsApp
    businessDescription: string;
    country: string;
    state: string;
    instagramHandle?: string;
    hasPhysicalStore: boolean;
    referralCode?: string;

    // Store Config
    storeType: StoreType;
    subscriptionTier: SubscriptionTier | null; // null if trial
    isTrial: boolean;
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
        description: 'For food vendors, restaurants, bakeries, and fast food chains.',
        color: 'from-orange-500 to-red-500'
    },
    {
        id: 'fashion',
        label: 'Fashion',
        icon: Shirt,
        description: 'Clothing brands, boutiques, textile retailers, and designers.',
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
        id: 'electronics',
        label: 'Electronics',
        icon: Laptop,
        description: 'Phones, solar equipment, gadgets, and electronic accessories.',
        color: 'from-blue-400 to-indigo-600'
    },
    {
        id: 'real-estate',
        label: 'Real Estate',
        icon: Building2,
        description: 'Property listings, rentals, and real estate services.',
        color: 'from-slate-700 to-slate-900'
    },
    {
        id: 'artist',
        label: 'Artist',
        icon: Sparkles,
        description: 'Music, merch, and creative services for artists.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'beauty',
        label: 'Beauty',
        icon: Sparkles,
        description: 'Cosmetics, makeup artists, perfume vendors etc.',
        color: 'from-pink-400 to-rose-600'
    },
    {
        id: 'home-services',
        label: 'Home Services',
        icon: Wrench,
        description: 'Cleaning, repairs, maintenance, and home improvement.',
        color: 'from-amber-600 to-orange-700'
    },
    {
        id: 'digital-products',
        label: 'Digital Products',
        icon: Laptop,
        description: 'E-books, courses, software, and digital assets.',
        color: 'from-indigo-500 to-blue-500'
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

const PriceDisplay = ({ price, originalPrice }: { price: number; originalPrice: number }) => {
    return (
        <div className="flex flex-col items-end">
            <AnimatePresence mode="wait">
                <motion.span
                    key={price}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-2xl font-black text-white"
                >
                    ₦{price.toLocaleString()}
                </motion.span>
            </AnimatePresence>
            {price < originalPrice && (
                <span className="text-xs text-slate-500 line-through">
                    ₦{originalPrice.toLocaleString()}
                </span>
            )}
            <span className="text-xs text-slate-500 block">weekly</span>
        </div>
    );
};

export default function RegisterPage({ params }: { params: { slug?: string[] } }) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [visibleChecklistItems, setVisibleChecklistItems] = useState(0);
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }

        if (step === 5) {
            setVisibleChecklistItems(0);
            const timers = [
                setTimeout(() => setVisibleChecklistItems(1), 800),
                setTimeout(() => setVisibleChecklistItems(2), 1600),
                setTimeout(() => setVisibleChecklistItems(3), 2400),
            ];
            return () => timers.forEach(clearTimeout);
        }
    }, [step]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<RegistrationData>({
        ceoName: '',
        ceoPhone: '',
        ceoEmail: '',
        logoImage: null,
        businessName: '',
        businessPhone: '',
        businessDescription: '',
        country: 'Morocco',
        state: '',
        storeType: 'general',
        subscriptionTier: null,
        isTrial: false,
        instagramHandle: '',
        hasPhysicalStore: false,
        referralCode: params?.slug?.[0] || ''
    });

    const handleInputChange = (field: keyof RegistrationData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, logoImage: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [showAllTrialFeatures, setShowAllTrialFeatures] = useState(false);

    const handleEmailSubmit = () => {
        if (!formData.ceoEmail || !formData.ceoEmail.includes('@')) {
            setEmailError('Please enter a valid email address');
            return;
        }
        setShowEmailModal(false);

        if (formData.isTrial) {
            handleTrialRegistration();
        } else {
            handlePayment();
        }
    };

    const handleTrialRegistration = async () => {
        setIsLoading(true);
        try {
            // 1. Upload Image to Cloudinary if exists
            let logoUrl = '';
            if (formData.logoImage) {
                const compressedFile = await compressImage(formData.logoImage);
                logoUrl = await uploadImageToCloudinary(compressedFile, 'registrations');
            }

            // 2. Save Registration to Firestore with Trial Status
            await addDoc(collection(db, 'registrations'), {
                ...formData,
                logoImage: null,
                logoUrl,
                amountPaid: 0,
                status: 'trial',
                trialEndsAt: calculateTrialEndDate(),
                createdAt: serverTimestamp()
            });

            setStep(5); // Success Step
            setIsLoading(false);
        } catch (error) {
            console.error('Trial registration error:', error);
            alert('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // 1. Upload Image to Cloudinary if exists
            let logoUrl = '';
            if (formData.logoImage) {
                const compressedFile = await compressImage(formData.logoImage);
                logoUrl = await uploadImageToCloudinary(compressedFile, 'registrations');
            }

            // 2. Initialize Paystack
            if (typeof (window as any).PaystackPop === 'undefined') {
                alert('Payment system is loading. Please wait a moment and try again.');
                setIsLoading(false);
                return;
            }

            const tierDetails = TIER_DETAILS[formData.subscriptionTier as keyof typeof TIER_DETAILS];
            // Apply 50% discount (Fake Discount Strategy)
            const finalPrice = tierDetails.price / 2;
            const amount = finalPrice * 100; // Convert to kobo

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
                            logoImage: null, // Don't save File object
                            logoUrl,
                            amountPaid: finalPrice,
                            paymentReference: response.reference,
                            status: 'active', // Active immediately if paid
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
            <div className="w-24 h-24 mx-auto bg-emerald-500/10 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 relative overflow-hidden">
                <Image
                    src="/bizz-app-logo.png"
                    alt="Bizz App Logo"
                    fill
                    className="object-cover"
                />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Build Your<br />Business Empire
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
                Start selling in minutes. Manage your entire business from your phone.
                <br />
                <span className="text-emerald-400 font-bold">Join 5,000+ Nigerian businesses.</span>
            </p>

            {/* Partner Badges */}
            <div className="space-y-3 pt-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">In partnership with</p>
                <div className="flex flex-nowrap justify-center items-center gap-2 px-2">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/50 backdrop-blur-sm shadow-lg whitespace-nowrap">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Paystack
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/50 backdrop-blur-sm shadow-lg whitespace-nowrap">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> OPay
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/50 backdrop-blur-sm shadow-lg whitespace-nowrap">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                    </div>
                </div>
            </div>

            {formData.referralCode && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-8 flex items-center gap-4 text-left"
                >
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                        <Zap className="w-6 h-6 text-white fill-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-emerald-400 uppercase tracking-tight">Referral Bonus Applied!</h3>
                        <p className="text-[11px] text-emerald-100/80 leading-tight">
                            You get a <span className="text-white font-bold">14-Day Free Trial</span> + <span className="text-white font-bold">50% Lifetime Discount</span> on all plans.
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="space-y-3 mt-8">
                <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
                >
                    Start My Empire (Free)
                </button>
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-400/80 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    <span>No credit card required • 14-Day Free Trial</span>
                </div>
            </div>
        </motion.div>
    );

    const renderStep2_Details = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Let's set up your business</h2>
                <p className="text-slate-400 text-sm">This takes less than 2 minutes.</p>
            </div>

            {/* Image Upload - Hidden for now */}
            {/* 
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
            */}

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

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Instagram Handle (Optional)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Instagram className="w-4 h-4 text-slate-500" />
                            </div>
                            <input
                                value={formData.instagramHandle}
                                onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                                placeholder="@yourhandle"
                                className="w-full pl-10 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Country</label>
                            <div className="relative">
                                <select
                                    value={formData.country}
                                    onChange={(e) => {
                                        handleInputChange('country', e.target.value);
                                        handleInputChange('state', '');
                                    }}
                                    className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none"
                                >
                                    <option value="">Select Country</option>
                                    {geography.map(c => (
                                        <option key={c.name} value={c.name}>
                                            {c.flag} {c.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">State</label>
                            <div className="relative">
                                <select
                                    value={formData.state}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                    disabled={!formData.country}
                                    className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none disabled:opacity-50"
                                >
                                    <option value="">Select State</option>
                                    {geography.find(c => c.name === formData.country)?.states.map(s => (
                                        <option key={s.name} value={s.name}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50 cursor-pointer" onClick={() => handleInputChange('hasPhysicalStore', !formData.hasPhysicalStore)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.hasPhysicalStore ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                            {formData.hasPhysicalStore && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-sm text-slate-300">I also sell in a physical shop</span>
                    </div>
                </div>
            </div>

            <button
                onClick={() => {
                    if (formData.businessName && formData.businessPhone) setStep(4);
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
                <h2 className="text-2xl font-bold text-white">What do you sell?</h2>
                <p className="text-slate-400 text-sm">This helps us customize your store.</p>
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
                onClick={() => setStep(3)}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold mt-4 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
                Continue
                <ArrowRight className="w-5 h-5" />
            </button>
        </motion.div>
    );

    const renderStep4_Subscription = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-24">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Choose How to Start</h2>
                <p className="text-slate-400 text-sm">Start free, or subscribe now for a lifetime discount.</p>
            </div>

            {/* Path A: Free Trial */}
            <div
                onClick={(e) => {
                    // Prevent triggering selection when clicking the "See more" button
                    if ((e.target as HTMLElement).closest('button.feature-toggle')) return;

                    handleInputChange('isTrial', true);
                    handleInputChange('subscriptionTier', null);
                    setShowEmailModal(true);
                }}
                className="relative p-6 rounded-3xl border-2 border-emerald-500 bg-emerald-500/10 cursor-pointer hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/10 group"
            >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg z-10">
                    MOST POPULAR
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
                        <Zap className="w-6 h-6 text-white fill-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Start Free Trial</h3>
                        <p className="text-xs text-emerald-200 font-medium">Try everything FREE for 14 days</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {[
                        'Your Own Website & App',
                        'Sell Up to 200 Products',
                        'Weekly Business Reports',
                        'Reliable Delivery Network',
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                            <div className="p-1 rounded-full bg-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            {feat}
                        </div>
                    ))}

                    <AnimatePresence>
                        {showAllTrialFeatures && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 overflow-hidden"
                            >
                                {[
                                    'Stock Management',
                                    'Order Management',
                                    'Customer Database (CRM)',
                                    'Marketing Tools',
                                    'AI Assistant'
                                ].map((feat, i) => (
                                    <div key={`more-${i}`} className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                        <div className="p-1 rounded-full bg-emerald-500/20">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                        {feat}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowAllTrialFeatures(!showAllTrialFeatures);
                    }}
                    className="feature-toggle w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
                >
                    {showAllTrialFeatures ? 'Show Less' : 'See 5 More Benefits'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAllTrialFeatures ? 'rotate-180' : ''}`} />
                </button>

                <button
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold group-hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading && formData.isTrial ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Setting up your store...</span>
                        </>
                    ) : (
                        "Start My Free Trial"
                    )}
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-3">No credit card required</p>
            </div>

            <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">Or Pay Now & Save 50% Forever</span>
                <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Path B: Paid Plans */}
            <div className="space-y-4">
                {(['basic', 'pro', 'promax'] as const).map((tier) => {
                    const details = TIER_DETAILS[tier as keyof typeof TIER_DETAILS];
                    // Fake Discount Logic: Display price is doubled in config, so we show it halved here
                    const discountedPrice = details.price / 2;

                    return (
                        <div
                            key={tier}
                            onClick={() => {
                                handleInputChange('isTrial', false);
                                handleInputChange('subscriptionTier', tier);
                                setShowEmailModal(true);
                            }}
                            className="relative p-3 md:p-4 rounded-2xl border border-slate-800 bg-slate-900/40 cursor-pointer hover:border-slate-600 transition-all flex items-center justify-between gap-3 group"
                        >
                            <div className="min-w-0">
                                <h3 className="text-sm md:text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                    {details.name} Plan
                                </h3>
                                <p className="text-[10px] text-slate-400 line-clamp-2">{details.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-[10px] md:text-xs text-slate-500 line-through block">₦{details.price.toLocaleString()}</span>
                                <span className="text-base md:text-lg font-black text-emerald-400">₦{discountedPrice.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500 block">weekly</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );

    const renderStep5_Success = () => {
        const isTrial = formData.isTrial;

        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-2xl mb-24 animate-bounce ${isTrial ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-blue-500 shadow-blue-500/40'}`}>
                    {isTrial ? (
                        <PartyPopper className="w-12 h-12 text-white" />
                    ) : (
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    )}
                </div>

                <h2 className="text-3xl font-black text-white mb-4">
                    {isTrial ? "You're In! 🎉" : "Registration Complete!"}
                </h2>

                <p className="text-slate-400 max-w-xs mx-auto mb-8">
                    {isTrial
                        ? "Your 14-day free trial has started. Your store is being set up right now."
                        : "We have received your payment. Your store is being set up right now."
                    }
                </p>

                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 max-w-sm mx-auto space-y-4">
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Setting up store...</p>
                            <p className="text-xs text-slate-500">Usually takes ~24 hours</p>
                        </div>
                    </div>

                    {/* Animated Checklist */}
                    <div className="space-y-3 pt-2">
                        <AnimatePresence>
                            {visibleChecklistItems >= 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-300">Domain Name Secured</p>
                                </motion.div>
                            )}
                            {visibleChecklistItems >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-300">WhatsApp Order Syncing...</p>
                                </motion.div>
                            )}
                            {visibleChecklistItems >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-white">Expert Review</p>
                                        <p className="text-[10px] text-slate-500 leading-tight">Our team is verifying your store for 100% uptime.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <p className="text-xs text-slate-500 mb-4 uppercase font-bold tracking-wider">Notification</p>
                        <p className="text-sm text-slate-300 mb-4">
                            We will notify you on <span className="text-emerald-400 font-bold">WhatsApp</span> at <span className="text-white">{formData.businessPhone}</span> when your store is ready.
                        </p>
                        <button
                            onClick={() => {
                                const message = encodeURIComponent(`Hello ATLAS™ Team! I just registered my store "${formData.businessName}" ${isTrial ? 'on the Free Trial' : 'and made payment'}. When will my store be live?`);
                                window.open(`https://wa.me/2347032905036?text=${message}`, '_blank');
                            }}
                            className="w-full py-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-2 group"
                        >
                            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Chat with Admin
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setStep(1)}
                    className="mt-8 text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors"
                >
                    Return to Home
                </button>
            </motion.div>
        );
    };

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
                    <div className={`flex items-center gap-2 w-full ${step === 1 ? 'justify-center' : 'justify-start'}`}>
                        {step !== 1 && (
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                                <Image
                                    src="/bizz-app-logo.png"
                                    alt="ATLAS™ Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <span className="font-bold text-xl tracking-tight">ATLAS™{step === 1 ? ' Network' : ''}</span>
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
                            {step === 2 && renderStep3_StoreType()}
                            {step === 3 && renderStep2_Details()}
                            {step === 4 && renderStep4_Subscription()}
                            {step === 5 && renderStep5_Success()}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Footer */}
                {step === 1 && (
                    <footer className="flex-none py-4 text-center text-[10px] text-slate-600 relative z-10 bg-black/50 backdrop-blur-sm">
                        <p>© {new Date().getFullYear()} Atlas Business Solutions. All rights reserved.</p>
                    </footer>
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
                            <h3 className="text-2xl font-bold text-center text-white mb-2">Create Your Account</h3>
                            <p className="text-slate-400 text-center text-sm mb-8">
                                Enter your email to secure your store.
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
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    {formData.isTrial ? 'Start Free Trial' : 'Continue to Payment'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
        </div>
    );
}
