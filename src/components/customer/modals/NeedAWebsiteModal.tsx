"use client";

import { X, Globe, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useWebsiteRegistrationModal } from '@/hooks/useWebsiteRegistrationModal';
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

  // WhatsApp validation: Accept 11 digits only for Nigeria
  const isValidWhatsApp = modal.formData.whatsapp.replace(/\D/g, '').length === 11;

  // Form validation helpers
  const isScreen1Valid = true;
  const isScreen2Valid = !!modal.formData.storeType;
  const isScreen3Valid = !!(
    modal.formData.businessName.trim().length >= 2 &&
    isValidWhatsApp &&
    modal.formData.email &&
    modal.formData.country &&
    modal.formData.state
  );
  const isScreen4Valid = !!modal.formData.planId;

  const handleClose = () => {
    modal.reset();
    onClose();
  };

  const handleNextScreen = () => {
    if (modal.currentScreen === 1 && !isScreen1Valid) return;
    if (modal.currentScreen === 2 && !isScreen2Valid) return;
    if (modal.currentScreen === 3 && !isScreen3Valid) return;
    if (modal.currentScreen === 4 && !isScreen4Valid) return;

    if (modal.currentScreen === 4) {
      handleInitiatePayment();
    } else {
      modal.nextScreen();
    }
  };

  const handleInitiatePayment = async () => {
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

      // Apply 50% discount (Fake Discount Strategy - same as /register)
      const finalPrice = tierDetails.price / 2;
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
      <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700/50 animate-in slide-in-from-bottom-5 sm:zoom-in-95 flex flex-col">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-blue-950 px-6 py-4 border-b border-slate-700/50 flex-shrink-0 z-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                <Globe className="text-amber-400" size={20} />
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

          {/* Progress bar only on screens 2-4 */}
          {typeof modal.currentScreen === 'number' && modal.currentScreen >= 2 && modal.currentScreen <= 4 && (
            <ProgressIndicator 
              currentStep={modal.currentScreen - 1} 
              totalSteps={3} 
            />
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pb-28">
            {/* Screen 1: Value Proposition */}
            {modal.currentScreen === 1 && (
              <div className="space-y-6">
                {/* Ramadan Badge */}
                <div className="flex items-center gap-2 justify-center">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    50% OFF RAMADAN PROMO
                  </div>
                </div>

                {/* Main Heading */}
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-white leading-tight">
                    Time to upgrade your side hustle to a business empire
                  </h1>
                  <p className="text-slate-300 text-base">
                    Get a professional website for as little as <span className="font-bold text-amber-400">₦500/week</span> (50% OFF) in just 3 steps.
                  </p>
                </div>

                {/* Limited Slots Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Limited Slots Available</p>
                    <p className="text-xs text-amber-200/70 mt-1">This Ramadan offer is exclusive and limited. Act now to secure your spot!</p>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-300">Mobile-first professional design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-300">Lightning-fast performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-300">SEO optimized for visibility</span>
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
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-white'
                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`mt-1 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                              {store.icon && <store.icon size={20} />}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm mb-1">{store.label}</p>
                              <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{store.description}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 mt-1">
                              <Check className="text-amber-400" size={20} />
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
                  <p className="text-sm text-slate-400">We'll use this to set up your website</p>
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
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
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
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
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
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors"
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

            {/* Screen 4: Subscription Plans */}
            {modal.currentScreen === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Choose Your Plan</h3>
                  <p className="text-sm text-slate-400">All plans include Ramadan promo pricing</p>
                </div>

                <div className="space-y-3">
                  {Object.entries(TIER_DETAILS).map(([tierId, tier]) => {
                    const isSelected = modal.formData.planId === tierId;
                    const promoPrice = Math.round(tier.price / 2);
                    return (
                      <button
                        key={tierId}
                        onClick={() => modal.updateForm({ planId: tierId })}
                        className={`relative w-full p-5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/20'
                            : 'border-slate-700 bg-slate-800/50 hover:border-amber-500/50'
                        }`}
                      >
                        {tier.featured && !isSelected && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Most Popular
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className="text-left pt-2">
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-slate-400 line-through">₦{tier.price.toLocaleString()}</span>
                              <div className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">
                                50% OFF
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-amber-400">
                              ₦{promoPrice.toLocaleString()}
                              <span className="text-xs text-slate-400 font-normal ml-1">{tier.period}</span>
                            </div>
                          </div>

                          <div className="space-y-2 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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

                {/* Ramadan Promo Messaging */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-amber-400">
                    🎉 Lifetime 50% Discount
                  </p>
                  <p className="text-xs text-amber-200/80">
                    All businesses registered before <span className="font-semibold">{RAMADAN_PROMO_END_DATE}</span> will receive a <span className="font-bold">permanent 50% discount</span> on their subscription plan. This is a one-time Ramadan offer!
                  </p>
                  <p className="text-xs text-amber-200/70 mt-3">
                    Weekly auto-renewing subscription. Cancel anytime.
                  </p>
                </div>
              </div>
            )}

            {/* Screen: Success */}
            {modal.currentScreen === 'success' && (
              <div className="text-center py-8 space-y-6">
                {/* Animated Checkmark */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center mx-auto border border-amber-300/50 shadow-lg shadow-amber-900/50 animate-pulse">
                  <Check className="text-white" size={32} />
                </div>

                {/* Success Message */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h3>
                  <p className="text-slate-300 text-sm">Your account is being set up</p>
                </div>

                {/* Full Business Details */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3 text-left">
                  {/* Business Name */}
                  <div className="flex items-start gap-3">
                    <Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">Business Name</p>
                      <p className="text-xs text-slate-400 mt-0.5">{modal.formData.businessName}</p>
                    </div>
                  </div>

                  {/* Store Type */}
                  {selectedStore && (
                    <div className="flex items-start gap-3">
                      <Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs font-semibold text-white">Category</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <selectedStore.icon size={14} className="text-amber-400" />
                          <p className="text-xs text-slate-400">{selectedStore.label}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">Email</p>
                      <p className="text-xs text-slate-400 mt-0.5">{modal.formData.email}</p>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-start gap-3">
                    <Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">WhatsApp</p>
                      <p className="text-xs text-slate-400 mt-0.5">+234{modal.formData.whatsapp}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white">Location</p>
                      <p className="text-xs text-slate-400 mt-0.5">{modal.formData.state}, {modal.formData.country}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  {selectedTierDetails && (
                    <div className="flex items-start gap-3">
                      <Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-xs font-semibold text-white">Plan</p>
                        <p className="text-xs text-amber-400 mt-0.5 font-semibold">₦{Math.round(selectedTierDetails.price / 2)}/week (50% OFF)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2 pt-4">
                  <button
                    onClick={() => handleClose()}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Continue Shopping
                  </button>
                  <button
                    className="w-full text-amber-400 font-semibold py-2 hover:text-amber-300 transition-colors text-sm"
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
            {typeof modal.currentScreen === 'number' && modal.currentScreen > 1 && (
              <button
                onClick={modal.prevScreen}
                className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-600 transition-colors font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNextScreen}
              disabled={(modal.currentScreen === 1 && !isScreen1Valid) ||
                       (modal.currentScreen === 2 && !isScreen2Valid) ||
                       (modal.currentScreen === 3 && !isScreen3Valid) ||
                       (modal.currentScreen === 4 && !isScreen4Valid) ||
                       modal.loading}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                ((modal.currentScreen === 1 && !isScreen1Valid) ||
                 (modal.currentScreen === 2 && !isScreen2Valid) ||
                 (modal.currentScreen === 3 && !isScreen3Valid) ||
                 (modal.currentScreen === 4 && !isScreen4Valid) ||
                 modal.loading)
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-900/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {modal.loading ? 'Processing...' : (modal.currentScreen === 1 ? 'Get Started' : modal.currentScreen === 4 ? 'Pay & Register' : 'Next')}
              {!modal.loading && typeof modal.currentScreen === 'number' && modal.currentScreen < 4 && <ArrowRight size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeedAWebsiteModal;
