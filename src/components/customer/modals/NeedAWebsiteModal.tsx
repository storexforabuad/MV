"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, ArrowRight, AlertCircle, Check, CreditCard, Sparkles, Package, Share2, MessageCircle } from 'lucide-react';
import { useWebsiteRegistrationModal } from '@/hooks/useWebsiteRegistrationModal';
import { useModalBackNavigation } from '@/hooks/useModalBackNavigation';
import CountryStateSelector from '@/components/shared/CountryStateSelector';
import ProgressIndicator from '@/components/shared/ProgressIndicator';
import { TIER_DETAILS, RAMADAN_PROMO_END_DATE, STORE_TYPES } from '@/config/countries';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NeedAWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName?: string;
}

const NeedAWebsiteModal = ({ isOpen, onClose, storeId, storeName }: NeedAWebsiteModalProps) => {
  const modal = useWebsiteRegistrationModal();
  const contentRef = useRef<HTMLDivElement>(null);

  const is420Hub = storeId === '420-Hub' || storeName === '420-Hub' || storeName === '420 Hub';
  const isStunnerStores = storeId?.toLowerCase().includes('stunner') || storeName?.toLowerCase().includes('stunner');

  const [platformIndex, setPlatformIndex] = useState(0);
  const platforms = [
    { name: 'WhatsApp', color: 'text-green-400' },
    { name: 'Instagram', color: 'text-pink-400' },
    { name: 'TikTok', color: 'text-cyan-400' }
  ];

  useEffect(() => {
    if (modal.currentScreen === 1) {
      const interval = setInterval(() => {
        setPlatformIndex((prev) => (prev + 1) % platforms.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [modal.currentScreen]);

  // Handle back button navigation
  useModalBackNavigation(isOpen, onClose, 'need-a-website');

  // Scroll to top when screen changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [modal.currentScreen]);

  // WhatsApp validation: Accept 11 digits only for Nigeria
  const isValidWhatsApp = modal.formData.whatsapp.replace(/\D/g, '').length === 11;

  // Form validation helpers
  const isScreen2Valid = !!modal.formData.storeType;
  const isScreen3Valid = !!(
    modal.formData.businessName.trim().length >= 2 &&
    isValidWhatsApp &&
    modal.formData.email &&
    modal.formData.country &&
    modal.formData.state
  );
  const isScreen4Valid = true; // Preview step always valid
  const isScreen5Valid = !!modal.formData.planId;

  const handleClose = () => {
    modal.reset();
    onClose();
  };

  const handleNextScreen = () => {
    if (modal.currentScreen === 2 && !isScreen2Valid) return;
    if (modal.currentScreen === 3 && !isScreen3Valid) return;
    if (modal.currentScreen === 4 && !isScreen4Valid) return;
    if (modal.currentScreen === 5 && !isScreen5Valid) return;

    if (modal.currentScreen === 5) {
      handleInitiatePayment();
    } else {
      modal.nextScreen();
    }
  };

  const handleInitiatePayment = () => {
    modal.setLoading(true);
    try {
      // Check if Paystack is loaded
      if (typeof window === 'undefined' || !(window as any).PaystackPop) {
        alert('Payment system is loading. Please wait a moment and try again.');
        modal.setLoading(false);
        return;
      }

      const tierDetails = TIER_DETAILS[modal.formData.planId as keyof typeof TIER_DETAILS];
      if (!tierDetails) throw new Error('Invalid plan selected');

      const finalPrice = Math.round(tierDetails.price / 2); // 50% Ramadan discount
      const amount = finalPrice * 100; // Convert to kobo

      const paystackConfig = {
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: modal.formData.email,
        amount: amount,
        currency: 'NGN',
        ref: `reg_${Date.now()}`,
        metadata: {
          custom_fields: [
            { display_name: "Business Name", variable_name: "business_name", value: modal.formData.businessName },
            { display_name: "Store Type", variable_name: "store_type", value: modal.formData.storeType },
            { display_name: "Tier", variable_name: "tier", value: modal.formData.planId }
          ]
        },
        onClose: () => modal.setLoading(false),
        callback: (response: any) => {
          (async () => {
            try {
              // Save to Firestore with same schema as /register
              await addDoc(collection(db, 'registrations'), {
                businessName: modal.formData.businessName,
                storeType: modal.formData.storeType,
                email: modal.formData.email,
                whatsapp: modal.formData.whatsapp,
                country: modal.formData.country,
                state: modal.formData.state,
                amountPaid: finalPrice,
                paymentReference: response.reference,
                status: 'active',
                referralCode: storeId, // Link this registration to the vendor storefront
                isWeeklyBilling: true, // Real paying customer — counts toward WeeklyRR
                createdAt: serverTimestamp()
              });

              // Show success screen
              modal.goToScreen('success');
              modal.setLoading(false);
            } catch (error) {
              console.error('Firestore error:', error);
              modal.setError('Failed to save registration. Please try again.');
              modal.setLoading(false);
            }
          })();
        }
      };

      // @ts-ignore
      const handler = (window as any).PaystackPop.setup(paystackConfig);
      handler.openIframe();
    } catch (error) {
      console.error('Payment error:', error);
      modal.setError('Failed to initiate payment. Please try again.');
      modal.setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get the selected tier details for success screen
  const selectedTierDetails = modal.formData.planId ? TIER_DETAILS[modal.formData.planId as keyof typeof TIER_DETAILS] : null;
  const selectedStore = modal.formData.storeType ? STORE_TYPES.find(s => s.id === modal.formData.storeType) : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700/50 animate-in slide-in-from-bottom-5 sm:zoom-in-95 flex flex-col relative">
        {/* Header - Sticky */}
        <div className={`sticky top-0 px-6 py-4 border-b border-slate-700/50 flex-shrink-0 z-10 ${isStunnerStores ? 'bg-gradient-to-r from-zinc-950 to-violet-950' : is420Hub ? 'bg-gradient-to-r from-zinc-950 to-emerald-950' : 'bg-gradient-to-r from-slate-900 to-blue-950'}`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isStunnerStores ? 'bg-violet-500/10 border-violet-500/20' : is420Hub ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-amber-400/10 border-amber-400/20'}`}>
                <Globe className={isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Get Your Website</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="text-slate-400" size={20} />
            </button>
          </div>

          {/* Progress bar only on screens 2-5 */}
          {typeof modal.currentScreen === 'number' && modal.currentScreen >= 2 && modal.currentScreen <= 5 && (
            <ProgressIndicator
              currentStep={modal.currentScreen - 1}
              totalSteps={4}
            />
          )}
        </div>

        {/* Content - Scrollable */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto transition-opacity duration-300 ${modal.loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="p-6 pb-28">
            {/* (Value-prop screen removed; category selection is now first visible step) */}

            {/* Screen 1: Cover Page */}
            {modal.currentScreen === 1 && (
              <div className="space-y-8 py-4">
                <div className="text-center space-y-6">
                  <div className="inline-block bg-amber-500/10 text-amber-500 font-black px-4 py-1.5 rounded-full text-[10px] sm:text-xs uppercase tracking-widest mb-2 border border-amber-500/20">
                    50% OFF RAMADAN PROMO
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black text-white leading-[1.2] tracking-tight">
                    Time to upgrade your<br />
                    <div className="h-[1.2em] relative overflow-hidden inline-block w-full align-bottom">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={platformIndex}
                          initial={{ y: 40, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -40, opacity: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={`absolute inset-0 w-full flex justify-center ${platforms[platformIndex].color}`}
                        >
                          {platforms[platformIndex].name}
                        </motion.div>
                      </AnimatePresence>
                    </div><br />
                    side hustle to a<br />
                    business empire
                  </h1>

                  <p className="text-slate-300 text-sm sm:text-base max-w-[320px] mx-auto leading-relaxed">
                    Get a professional Website for <span className="line-through text-slate-500 decoration-amber-500 pr-1">₦850,000</span>
                    <br className="hidden sm:block" />
                    as little as <span className="font-bold text-amber-500">₦500/week</span> in minutes.
                  </p>
                </div>

                <div className="flex flex-col gap-4 w-full px-4 sm:px-8 my-8">
                  {[
                    { icon: Package, text: "Upload and manage up to 1,000 products easily" },
                    { icon: Share2, text: "Get a unique .com link to share & put on your social media bio" },
                    { icon: MessageCircle, text: 'Receive perfectly organized, ready-to-pay orders on WhatsApp. No more "How much?" DMs.' }
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3 text-left">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isStunnerStores ? 'bg-cyan-500/10 text-cyan-400' : is420Hub ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                        <benefit.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-300 leading-snug">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 max-w-sm mx-auto">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/10 p-2 rounded-xl mt-0.5 shrink-0 border border-amber-500/20">
                      <AlertCircle className="text-amber-500" size={20} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-amber-500 text-xs sm:text-sm mb-1 uppercase tracking-tight">Limited Slots Available</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">This Ramadan offer is exclusive and limited. Act now to secure your spot!</p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <div className="text-[10px] text-slate-500/70 font-medium tracking-wide flex flex-wrap items-center justify-center gap-1">
                    <span>Powered by <span className={`font-black tracking-tight ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`}>BizconNet™</span> 2026</span>
                    <span className="flex flex-wrap items-center justify-center gap-1">
                      in partnership with
                      <span className="flex items-center font-bold ml-0.5 text-[11px] tracking-tight">
                        <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span>,
                      </span>
                      <span className="font-bold text-[#25D366] text-[11px] tracking-tight">
                        WhatsApp
                      </span>
                      <span className="px-0.5 text-slate-400">&amp;</span>
                      <span className="font-bold text-[#00C3F7] text-[11px] tracking-tight">
                        Paystack.
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 2: Category Selection */}
            {modal.currentScreen === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">What's Your Business?</h3>
                  <p className="text-sm text-slate-400">Select your primary business category</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {STORE_TYPES.map((store) => {
                    const isSelected = modal.formData.storeType === store.id;
                    return (
                      <button
                        key={store.id}
                        onClick={() => modal.updateForm({ storeType: store.id })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                          ? isStunnerStores ? 'border-violet-500 bg-violet-500/20 text-white' : is420Hub ? 'border-emerald-500 bg-emerald-500/20 text-white' : 'border-amber-500 bg-amber-500/20 text-white'
                          : isStunnerStores ? 'border-zinc-800 bg-zinc-900/50 text-slate-300 hover:border-violet-500/50' : is420Hub ? 'border-zinc-800 bg-zinc-900/50 text-slate-300 hover:border-emerald-500/50' : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-amber-500/50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`mt-1 ${isSelected ? (isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-400'}`}>
                              {store.icon && <store.icon size={20} />}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm mb-1">{store.label}</p>
                              <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{store.description}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 mt-1">
                              <Check className={isStunnerStores ? "text-cyan-400" : is420Hub ? "text-emerald-400" : "text-amber-400"} size={20} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Screen 3: Business Details */}
            {modal.currentScreen === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Tell Us About Your Business</h3>
                  <p className="text-sm text-slate-400">We'll use this to set up your Website</p>
                </div>

                {modal.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{modal.error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={modal.formData.businessName}
                      onChange={(e) => modal.updateForm({ businessName: e.target.value })}
                      placeholder="Your business name"
                      className={`w-full px-4 py-3 bg-slate-800 border ${isStunnerStores ? 'border-zinc-700 focus:border-violet-500 focus:ring-violet-500/50' : is420Hub ? 'border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/50' : 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/50'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors`}
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={modal.formData.whatsapp}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        const formatted = digitsOnly.slice(0, 11);
                        modal.updateForm({ whatsapp: formatted });
                      }}
                      placeholder="08012345678"
                      className={`w-full px-4 py-3 bg-slate-800 border ${isStunnerStores ? 'border-zinc-700 focus:border-violet-500 focus:ring-violet-500/50' : is420Hub ? 'border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/50' : 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/50'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors`}
                    />
                    <p className="text-xs text-slate-500 mt-1">11 digits (e.g., 08012345678)</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      value={modal.formData.email}
                      onChange={(e) => modal.updateForm({ email: e.target.value })}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 bg-slate-800 border ${isStunnerStores ? 'border-zinc-700 focus:border-violet-500 focus:ring-violet-500/50' : is420Hub ? 'border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/50' : 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/50'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors`}
                    />
                  </div>

                  {/* Country & State */}
                  <CountryStateSelector
                    selectedCountry={modal.formData.country}
                    selectedState={modal.formData.state}
                    onCountryChange={(country) => modal.updateForm({ country })}
                    onStateChange={(state) => modal.updateForm({ state })}
                  />
                </div>
              </div>
            )}

            {/* Screen 4: Professional Identity Preview */}
            {modal.currentScreen === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Review Your Professional Identity</h3>
                  <p className="text-sm text-slate-400">Your Website is almost ready to go live!</p>
                </div>

                {/* Store Link Preview - On Brand Style */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                  <div className={`flex items-center gap-2 ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <Globe size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Website Link Preview</span>
                  </div>

                  <div className={`bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between group cursor-pointer transition-all ${isStunnerStores ? 'hover:border-violet-500/50' : is420Hub ? 'hover:border-emerald-500/50' : 'hover:border-amber-500/50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-1">Your Unique Web Address</p>
                      <p className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} font-bold truncate`}>
                        tinyurl.com/bizconnet/{modal.formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isStunnerStores ? 'bg-violet-500/10 text-cyan-400 group-hover:bg-violet-500' : is420Hub ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500' : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500'} group-hover:text-white`}>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-1">Category</p>
                      <p className="text-white text-xs font-semibold truncate">
                        {selectedStore?.label || 'General Store'}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-1">Location</p>
                      <p className="text-white text-xs font-semibold truncate">
                        {modal.formData.state}, {modal.formData.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">What Happens Next?</h4>
                  <div className="space-y-2">
                    {[
                      { icon: CreditCard, text: "Choose a plan that fits your volume" },
                      { icon: Check, text: "Secure payment via Paystack" },
                      { icon: Sparkles, text: "Your Website goes live instantly!" }
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                        <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                          <step.icon size={12} />
                        </div>
                        <span className="text-xs text-slate-300 font-medium">{step.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust Element */}
                <div className="text-center pt-2">
                  <p className="text-[10px] text-slate-500 font-medium">
                    Joining <span className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>5,000+ digital vendors</span> across Nigeria & Africa.
                  </p>
                </div>
              </div>
            )}

            {/* Screen 5: Subscription Plans (Previously Step 4) */}
            {modal.currentScreen === 5 && (
              <div className="space-y-6">
                <div className="relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className={isStunnerStores ? "text-cyan-400" : is420Hub ? "text-emerald-400" : "text-amber-400"} size={20} />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Ramadan Special Offer</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Get your professional business Website live this season with our <span className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>limited-time 50% discount</span>.
                  </p>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg w-fit ${isStunnerStores ? 'bg-violet-500/10 border-violet-500/20' : is420Hub ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isStunnerStores ? 'bg-cyan-400' : is420Hub ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`}>Ramadan Exclusive • Go Live Today</span>
                </div>

                <div className="space-y-3">
                  {Object.entries(TIER_DETAILS).map(([tierId, tier]) => {
                    const isSelected = modal.formData.planId === tierId;
                    const promoPrice = Math.round(tier.price / 2);
                    return (
                      <button
                        key={tierId}
                        onClick={() => modal.updateForm({ planId: tierId })}
                        className={`relative w-full p-5 rounded-xl border transition-all text-left ${isSelected
                          ? isStunnerStores ? 'border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/20' : is420Hub ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/20' : 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/20'
                          : isStunnerStores ? 'border-slate-700 bg-slate-800/50 hover:border-violet-500/50' : is420Hub ? 'border-slate-700 bg-slate-800/50 hover:border-emerald-500/50' : 'border-slate-700 bg-slate-800/50 hover:border-amber-500/50'
                          }`}
                      >
                        {tier.featured && !isSelected && (
                          <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${isStunnerStores ? 'bg-gradient-to-r from-violet-500 to-violet-600' : is420Hub ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}>
                            Most Popular
                          </div>
                        )}

                        {isSelected && (
                          <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${isStunnerStores ? 'bg-violet-500' : is420Hub ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className="text-left pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-slate-300 font-bold uppercase tracking-wide">{tier.name} Plan</div>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-slate-400 line-through">₦{tier.price.toLocaleString()}</span>
                              <div className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${isStunnerStores ? 'bg-violet-500/10 text-cyan-400 border-violet-500/20' : is420Hub ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                Special Ramadan Rate
                              </div>
                            </div>
                            <div className={`text-2xl font-black ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`}>
                              ₦{promoPrice.toLocaleString()}
                              <span className="text-xs text-slate-400 font-normal ml-1 lowercase">/{tier.period}</span>
                            </div>
                          </div>

                          <div className="space-y-2 text-left">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${isStunnerStores ? 'bg-cyan-400' : is420Hub ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <span className="text-sm text-slate-300">
                                {tier.productLimit.toLocaleString()} products
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Value Prop Messaging */}
                <div className={`border rounded-xl p-4 space-y-3 ${isStunnerStores ? 'bg-violet-500/5 border-violet-500/20' : is420Hub ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isStunnerStores ? 'bg-violet-500/20' : is420Hub ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      <Sparkles className={isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} size={16} />
                    </div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">
                      Celebrate Ramadan Digitally
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    Celebrate Ramadan by taking your business digital. Join <span className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>5000+ vendors</span> already selling online this season.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Weekly auto-renewing subscription. Cancel anytime.
                  </p>
                </div>
              </div>
            )}

            {/* Screen: Success */}
            {modal.currentScreen === 'success' && (
              <div className="text-center py-8 space-y-6">
                {/* Animated Checkmark */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border shadow-lg animate-pulse ${isStunnerStores ? 'bg-gradient-to-r from-violet-400 to-violet-500 border-violet-300/50 shadow-violet-900/50' : is420Hub ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 border-emerald-300/50 shadow-emerald-900/50' : 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-300/50 shadow-amber-900/50'}`}>
                  <Check className="text-white" size={32} />
                </div>

                {/* Success Message */}
                <div>
                  <h3 className={`text-2xl font-bold text-white mb-2 underline ${isStunnerStores ? 'decoration-cyan-500/30' : is420Hub ? 'decoration-emerald-500/30' : 'decoration-amber-500/30'}`}>Welcome Aboard!</h3>
                  <p className="text-slate-300 text-sm px-4 leading-relaxed italic">Congratulations! You've successfully secured the <span className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} font-black uppercase tracking-tight`}>Ramadan Special</span> offer for your business.</p>
                </div>

                {/* Full Business Details */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3 text-left">
                  {/* Business Name */}
                  <div className="flex items-start gap-3">
                    <Check className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0 mt-0.5`} size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">Business Name</p>
                      <p className="text-xs text-slate-400 mt-0.5">{modal.formData.businessName}</p>
                    </div>
                  </div>

                  {/* Store Type */}
                  {selectedStore && (
                    <div className="flex items-start gap-3">
                      <Check className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0 mt-0.5`} size={18} />
                      <div>
                        <p className="text-xs font-semibold text-white">Category</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <selectedStore.icon size={14} className={isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} />
                          <p className="text-xs text-slate-400">{selectedStore.label}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Check className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0 mt-0.5`} size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">Email</p>
                      <p className="text-xs text-slate-400 mt-0.5">{modal.formData.email}</p>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-start gap-3">
                    <Check className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0 mt-0.5`} size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">WhatsApp</p>
                      <p className="text-xs text-slate-400 mt-0.5">+234{modal.formData.whatsapp}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <Check className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0 mt-0.5`} size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">Location</p>
                      <p className="text-xs text-slate-400 mt-0.5">{modal.formData.state}, {modal.formData.country}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  {selectedTierDetails && (
                    <div className="flex items-start gap-3">
                      <Check className={`${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0 mt-0.5`} size={18} />
                      <div>
                        <p className="text-xs font-semibold text-white">Plan</p>
                        <p className={`text-xs ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'} mt-0.5 font-semibold`}>₦{Math.round(selectedTierDetails.price / 2)}/week (Special Rate)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => handleClose()}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${isStunnerStores ? 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-violet-900/30' : is420Hub ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-900/30' : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-900/30'}`}
                  >
                    Continue Shopping
                  </button>
                  <button
                    className={`w-full font-semibold py-2 transition-colors text-sm ${isStunnerStores ? 'text-cyan-400 hover:text-cyan-300' : is420Hub ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'}`}
                  >
                    Chat with Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        {modal.currentScreen !== 'success' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent px-6 py-4 border-t border-slate-700/50 flex gap-2">
            {typeof modal.currentScreen === 'number' && modal.currentScreen > 2 && (
              <button
                onClick={modal.prevScreen}
                className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-600 transition-colors font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNextScreen}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${((modal.currentScreen === 2 && !isScreen2Valid) ||
                (modal.currentScreen === 3 && !isScreen3Valid) ||
                (modal.currentScreen === 4 && !isScreen4Valid) ||
                (modal.currentScreen === 5 && !isScreen5Valid))
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : isStunnerStores
                  ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.02] active:scale-[0.98]'
                  : is420Hub
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-900/30 hover:scale-[1.02] active:scale-[0.98]'
                } ${modal.loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              {modal.loading ? (
                'Processing...'
              ) : modal.currentScreen === 1 ? (
                <>Continue</>
              ) : modal.currentScreen === 5 ? (
                <>
                  Register
                  <CreditCard size={18} />
                </>
              ) : modal.currentScreen === 4 ? (
                <>Select Plan</>
              ) : (
                <>Next</>
              )}
              {!modal.loading && typeof modal.currentScreen === 'number' && modal.currentScreen < 5 && <ArrowRight size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeedAWebsiteModal;
