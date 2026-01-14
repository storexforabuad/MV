'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    User, Building2, Phone, Mail, MapPin, Briefcase,
    CheckCircle2, ChevronRight, ChevronLeft, Loader2,
    Sparkles, CreditCard, Upload, Store, ShoppingBag,
    UtensilsCrossed, Shirt, Car, Fish, Globe, Laptop,
    PartyPopper, GraduationCap, Bot, Tag, ArrowRight,
    MessageCircle, Smartphone
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
    ceoImage: File | null;
    ceoImageUrl?: string;

    // Business Details
    businessName: string;
    businessPhone: string; // WhatsApp
    businessDescription: string;
    country: string;
    state: string;
    referralCode?: string;

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
        icon: Building2,
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
        country: 'Morocco',
        state: '',
        storeType: 'general',
        subscriptionTier: 'pro',
        referralCode: ''
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
                            referralCode: formData.referralCode || null,
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
                    src="/bizz-app-logo.jpg"
                    alt="Bizz App Logo"
                    fill
                    className="object-cover"
                />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Join the Future<br />of Commerce
            </h1>
            <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
                Create your premium online store in minutes.
                <br />
                <span className="text-emerald-400 font-bold">Bizz App™</span> - Your Business, All in One App.
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

            <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10 mt-6"
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
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold mt-4 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
                Continue
                <ArrowRight className="w-5 h-5" />
            </button>
        </motion.div>
    );

    const [discountInput, setDiscountInput] = useState('');
    const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

    const handleApplyDiscount = async () => {
        if (!discountInput) return;
        setIsApplyingDiscount(true);
        // Simulate API call/validation delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        handleInputChange('referralCode', discountInput);
        setIsApplyingDiscount(false);
    };

    const renderStep4_Subscription = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-24">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Select a Plan</h2>
                <p className="text-slate-400 text-sm">Choose the perfect plan for your business.</p>
            </div>

            {/* Discount Code Input */}
            <div className="space-y-2">
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Tag className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Have a discount code?"
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none text-sm"
                        />
                    </div>
                    <button
                        onClick={handleApplyDiscount}
                        disabled={!discountInput || isApplyingDiscount}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 min-w-[100px] justify-center"
                    >
                        {isApplyingDiscount ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Apply'
                        )}
                    </button>
                </div>
                {formData.referralCode && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-end gap-2"
                    >
                        <span className="text-xs font-bold text-emerald-500 animate-pulse">🎉 50% OFF APPLIED!</span>
                        <button
                            onClick={() => {
                                handleInputChange('referralCode', '');
                                setDiscountInput('');
                            }}
                            className="text-[10px] text-slate-500 hover:text-red-400 underline"
                        >
                            Remove
                        </button>
                    </motion.div>
                )}
            </div>

            <div className="space-y-4">
                {(['basic', 'pro', 'promax'] as const).map((tier) => {
                    const details = TIER_DETAILS[tier as keyof typeof TIER_DETAILS];
                    const isSelected = formData.subscriptionTier === tier;
                    const isProMax = tier === 'promax';
                    const isPro = tier === 'pro';

                    // Discount Logic
                    const hasDiscount = !!formData.referralCode;
                    const currentPrice = hasDiscount ? details.price / 2 : details.price;

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
                                <PriceDisplay price={currentPrice} originalPrice={details.price} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isProMax ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                                    }`}>
                                    {typeof details.productLimit === 'number' ? `${details.productLimit} Products` : details.productLimit}
                                </div>

                                {(isPro || isProMax) && (
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${isProMax ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                                        }`}>
                                        <Bot className="w-3 h-3" />
                                        A.I Assistant
                                    </div>
                                )}
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

            {/* Pay Button - Moved back to main content */}
            <button
                onClick={() => setShowEmailModal(true)}
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8 shadow-xl shadow-emerald-500/20"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        Pay & Register
                    </>
                )}
            </button>
        </motion.div>
    );

    const renderStep5_Success = () => (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8 animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Registration Complete!</h2>
            <p className="text-slate-400 max-w-xs mx-auto mb-8">
                Welcome to BizzApp! We have received your details and payment. Our team is setting up your store right now.
            </p>
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 max-w-sm mx-auto">
                <p className="text-sm text-slate-300">
                    You will receive an email at <span className="text-emerald-400 font-bold">{formData.ceoEmail}</span> shortly with your login details.
                </p>
            </div>
            <button
                onClick={() => window.location.href = '/'}
                className="mt-12 text-emerald-500 font-bold hover:text-emerald-400"
            >
                Return to Home
            </button>
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
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                            <Image
                                src="/bizz-app-logo.jpg"
                                alt="Bizz App Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Bizz App™</span>
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
                            <h3 className="text-2xl font-bold text-center text-white mb-2">One Last Thing!</h3>
                            <p className="text-slate-400 text-center text-sm mb-8">
                                Please enter your email address to receive important alerts.                            </p>

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
                                    Continue to Payment
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
