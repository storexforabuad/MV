'use client';

import { useState, ChangeEvent, FormEvent, useRef, useEffect } from "react";
import { StoreMeta } from "../../../types/store";
import { calculateTrialEndDate } from "../../../types/subscription";
import { geography } from "../../../config/geography";
import { categorySuggestions } from "../../../config/categories";
import { db } from "../../../lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { uploadImageToCloudinary } from "../../../lib/cloudinaryClient";
import { compressImage } from "../../../utils/imageCompression";
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Store,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ImagePlus,
  Building2,
  User,
  MapPin,
  Globe
} from 'lucide-react';
import { FloatingLabelInput, ModernToggle } from '../../ui/ComposerInputs';

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // Registration data
}

export default function CreateStoreModal({
  isOpen,
  onClose,
  initialData
}: CreateStoreModalProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0: CEO, 1: Business, 2: Categories, 3: Creating, 4: Success
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<StoreMeta>>({
    name: "",
    whatsapp: "",
    ceoName: "",
    ceoEmail: "",
    ceoPhone: "",
    ceoInstagram: "",
    businessDescription: "",
    businessInstagram: "",
    socialStats: {
      instagramFollowers: 0,
      tiktokFollowers: 0,
      youtubeSubscribers: 0,
      twitterFollowers: 0,
    },
    hasPhysicalShop: false,
    shopNumber: "",
    plazaBuildingName: "",
    streetAddress: "",
    country: "",
    state: "",
    storeType: "general",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
    isInfluencer: false,
    isTestStore: false,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Pre-fill form with initialData if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.businessName || "",
        whatsapp: initialData.businessPhone || "",
        ceoName: initialData.ceoName || "",
        ceoEmail: initialData.ceoEmail || "",
        ceoPhone: initialData.ceoPhone || "",
        storeType: initialData.storeType?.trim() || "general",
        businessDescription: initialData.businessDescription || "",
        country: initialData.country || "",
        state: initialData.state || "",
      }));
      if (initialData.logoUrl) {
        setImagePreview(initialData.logoUrl);
      }
    }
  }, [initialData]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('socialStats.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        socialStats: {
          ...prev.socialStats,
          [field]: parseInt(value) || 0,
        }
      }));
    } else if (name === 'storeType') {
      if (value === 'media-influencer') {
        setFormData((prev) => ({ ...prev, storeType: value, isInfluencer: true, isTestStore: false }));
      } else {
        setFormData((prev) => ({ ...prev, storeType: value, isInfluencer: false }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, country: e.target.value, state: "" }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    } else {
      setCategories(categories.filter((c) => c !== category));
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !categories.includes(customCategory.trim())) {
      setCategories([...categories, customCategory.trim()]);
      setCustomCategory("");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setCurrentStep(3); // Move to creating screen

    try {
      let logoUrl = imagePreview || "";
      if (logoFile) {
        const compressedFile = await compressImage(logoFile);
        logoUrl = await uploadImageToCloudinary(compressedFile, 'stores');
      }

      // Generate Store ID
      const slugify = (text: string) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-');
      };

      const baseId = slugify(formData.name || "new-store");
      // Check if store ID exists, if so append a short random string
      let storeId = baseId;
      const storeDoc = await getDocs(query(collection(db, 'stores'), where('id', '==', storeId)));
      if (!storeDoc.empty) {
        storeId = `${baseId}-${Math.random().toString(36).substring(2, 7)}`;
      }

      const storeRef = doc(db, 'stores', storeId);

      // Determine Subscription Status
      const isInfluencer = formData.isInfluencer;
      const isTestStore = formData.isTestStore;
      const isPaidRegistration = (initialData?.amountPaid || 0) > 0;
      const subscriptionStatus = (isPaidRegistration || isInfluencer) ? 'active' : 'trial';
      const trialEndsAt = (isPaidRegistration || isInfluencer) ? null : calculateTrialEndDate();

      const finalFormData = {
        ...formData,
        id: storeId,
        storeType: (formData.storeType || 'general').trim(),
        logo: logoUrl,
        ceoImage: logoUrl, // Keep for backward compatibility or if needed
        name: formData.name ?? "Default Store Name",
        whatsapp: formData.whatsapp ?? "",

        // Stats & Status
        totalViews: 0,
        totalOrders: 0,
        totalCommissionEarned: 0,
        hasCompletedOnboarding: true,
        fcmToken: initialData?.fcmToken || "",

        // Subscription Logic
        subscriptionStatus: isInfluencer ? 'active' : (isTestStore ? 'trial' : subscriptionStatus),
        subscriptionTier: isInfluencer ? 'max' : (initialData?.subscriptionTier || (formData.storeType?.trim() === 'general' ? 'general' : 'basic')),
        subscriptionStartDate: serverTimestamp(),
        trialEndsAt: trialEndsAt,
        subscriptionPlanCode: isInfluencer ? 'influencer_free' : (isTestStore ? 'test_store' : (isPaidRegistration ? 'paid_registration' : 'manual_trial')),
        isInfluencer: isInfluencer || false,
        isFreePlan: isInfluencer || false,
        isTestStore: isTestStore || false,
        isWeeklyBilling: initialData?.isWeeklyBilling || false, // Only true for NeedAWebsiteModal signups

        // Referral Tracking
        referralCode: initialData?.referralCode || null,
        referralDate: initialData?.referralCode ? serverTimestamp() : null,
      };

      await setDoc(storeRef, finalFormData);

      const batch = writeBatch(db);
      const allCategories = [...new Set(categories)];

      allCategories.forEach((categoryName) => {
        const categoryRef = doc(collection(db, `stores/${storeId}/categories`));
        batch.set(categoryRef, { name: categoryName, createdAt: serverTimestamp() });
      });

      await batch.commit();

      // If created from registration, mark registration as completed
      if (initialData?.id) {
        const registrationRef = doc(db, "registrations", initialData.id);
        await updateDoc(registrationRef, { status: "completed" });
      }

      console.log("Store and categories created successfully!");
      setCurrentStep(4); // Success
    } catch (error) {
      console.error("Error creating store:", error);
      alert("Error creating store. Please try again.");
      setCurrentStep(2); // Go back to last step
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setCurrentStep(0);
    setFormData({
      name: "",
      whatsapp: "",
      ceoName: "",
      ceoEmail: "",
      ceoPhone: "",
      ceoInstagram: "",
      businessDescription: "",
      businessInstagram: "",
      socialStats: {
        instagramFollowers: 0,
        tiktokFollowers: 0,
        youtubeSubscribers: 0,
        twitterFollowers: 0,
      },
      hasPhysicalShop: false,
      shopNumber: "",
      plazaBuildingName: "",
      streetAddress: "",
      country: "",
      state: "",
      storeType: "general",
      bankAccountName: "",
      bankAccountNumber: "",
      bankName: "",
      isInfluencer: false,
      isTestStore: false,
    });
    setCategories([]);
    setLogoFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  const STEPS = [{ name: 'CEO Details' }, { name: 'Business Info' }, { name: 'Categories' }];
  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };
  const MotionDiv = motion.div;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // CEO Details
        return (
          <MotionDiv key={0} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div
                className="w-32 h-32 rounded-full border-4 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="Logo Preview" fill className="object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500">
                    <ImagePlus className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">Upload Logo</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
              </div>
              <p className="text-sm text-slate-500 mt-2">Tap to upload store logo</p>
            </div>

            <FloatingLabelInput label="Full Name" name="ceoName" value={formData.ceoName || ''} onChange={(e) => handleInputChange(e)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingLabelInput label="Phone Number" name="ceoPhone" value={formData.ceoPhone || ''} onChange={(e) => handleInputChange(e)} required />
              <FloatingLabelInput label="Email Address" name="ceoEmail" type="email" value={formData.ceoEmail || ''} onChange={(e) => handleInputChange(e)} required />
            </div>
            <FloatingLabelInput label="Instagram (@username)" name="ceoInstagram" value={formData.ceoInstagram || ''} onChange={(e) => handleInputChange(e)} />
          </MotionDiv>
        );

      case 1: // Business Info
        const selectedCountry = geography.find(c => c.name === formData.country);
        return (
          <MotionDiv key={1} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <FloatingLabelInput label="Business Name" name="name" value={formData.name || ''} onChange={(e) => handleInputChange(e)} required />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingLabelInput label="Business WhatsApp" name="whatsapp" value={formData.whatsapp || ''} onChange={(e) => handleInputChange(e)} />
              <FloatingLabelInput label="Business Instagram" name="businessInstagram" value={formData.businessInstagram || ''} onChange={(e) => handleInputChange(e)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Store Type</label>
              <div className="relative">
                <select
                  name="storeType"
                  value={formData.storeType || 'general'}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="general">🛍️ General (Retail, Food, etc.)</option>
                  <option value="restaurant">🍔 Restaurant (Food & Drinks)</option>
                  <option value="fashion">👗 Fashion (Ready-to-Wear, Bespoke)</option>
                  <option value="beauty">✨ Beauty (Cosmetics, Skincare)</option>
                  <option value="electronics">📱 Electronics (Gadgets, Devices)</option>
                  <option value="livestock">🐟 Livestock (Fishery & Aquaculture)</option>
                  <option value="artdealer">🎨 Art Dealer (Gallery & Artist)</option>
                  <option value="automotive">🚗 Automotive (Car Dealership)</option>
                  <option value="solar">☀️ Solar & Renewable Energy</option>
                  <option value="media-influencer">📣 Media Influencer (PR & Collab)</option>
                  <option value="social-commerce">🌐 Social Commerce</option>
                  <option value="digital-products">💻 Digital Products</option>
                  <option value="consultancy">🎓 Consultancy</option>
                  <option value="events">🎉 Events</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Location</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <select name="country" value={formData.country} onChange={handleCountryChange} className="block w-full px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                    <option value="">Select Country</option>
                    {geography.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <select name="state" value={formData.state} onChange={handleInputChange} disabled={!formData.country} className="block w-full px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50">
                    <option value="">Select State</option>
                    {selectedCountry?.states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <ModernToggle
              label="Influencer Account?"
              description="Free Forever Max Account"
              checked={formData.isInfluencer || false}
              onChange={checked => setFormData(prev => ({
                ...prev,
                isInfluencer: checked,
                storeType: checked ? 'media-influencer' : prev.storeType === 'media-influencer' ? 'general' : prev.storeType,
                isTestStore: false
              }))}
            />

            <ModernToggle
              label="Test Store?"
              description="Internal use only — excluded from metrics"
              checked={formData.isTestStore || false}
              onChange={checked => setFormData(prev => ({ ...prev, isTestStore: checked, isInfluencer: false }))}
            />

            <ModernToggle label="Physical Shop?" description="Do you have a physical location?" checked={formData.hasPhysicalShop || false} onChange={checked => setFormData(prev => ({ ...prev, hasPhysicalShop: checked }))} />

            <AnimatePresence>
              {formData.hasPhysicalShop && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FloatingLabelInput label="Shop Number" name="shopNumber" value={formData.shopNumber || ''} onChange={(e) => handleInputChange(e)} />
                    <FloatingLabelInput label="Plaza Name" name="plazaBuildingName" value={formData.plazaBuildingName || ''} onChange={(e) => handleInputChange(e)} />
                  </div>
                  <FloatingLabelInput label="Street Address" name="streetAddress" value={formData.streetAddress || ''} onChange={(e) => handleInputChange(e)} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {formData.storeType === 'media-influencer' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-pink-500" /> Social Identity
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Let brands see your reach (estimated counts).</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingLabelInput label="IG Followers" name="socialStats.instagramFollowers" type="number" value={formData.socialStats?.instagramFollowers || ''} onChange={(e) => handleInputChange(e)} />
                    <FloatingLabelInput label="TikTok Followers" name="socialStats.tiktokFollowers" type="number" value={formData.socialStats?.tiktokFollowers || ''} onChange={(e) => handleInputChange(e)} />
                    <FloatingLabelInput label="YouTube Subs" name="socialStats.youtubeSubscribers" type="number" value={formData.socialStats?.youtubeSubscribers || ''} onChange={(e) => handleInputChange(e)} />
                    <FloatingLabelInput label="X/Twitter Followers" name="socialStats.twitterFollowers" type="number" value={formData.socialStats?.twitterFollowers || ''} onChange={(e) => handleInputChange(e)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Description</label>
              <textarea
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleInputChange}
                placeholder="Describe your business..."
                className="block w-full px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
              />
            </div>
          </MotionDiv>
        );

      case 2: // Categories
        return (
          <MotionDiv key={2} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select Categories</h3>
              <p className="text-sm text-slate-500">What do you sell?</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {categorySuggestions.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${categories.includes(cat)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative mt-4">
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Add custom category..."
                className="block w-full px-4 py-3.5 pr-12 text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                onClick={handleAddCustomCategory}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            </div>

            {categories.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selected</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <span key={c} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1">
                      {c}
                      <button onClick={() => handleCategorySelect(c)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </MotionDiv>
        );

      case 3: // Creating
        return (
          <MotionDiv key={3} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Creating Store...</h3>
              <p className="text-slate-500 dark:text-slate-400">Setting up your digital storefront.</p>
            </div>
          </MotionDiv>
        );

      case 4: // Success
        return (
          <MotionDiv key={4} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Store Created!</h3>
              <p className="text-slate-500 dark:text-slate-400">Your store is now live and ready.</p>
            </div>
          </MotionDiv>
        );

      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden" animate="visible" exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* --- Header --- */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {currentStep === 3 ? 'Processing' : currentStep === 4 ? 'Success' : 'Create New Store'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Step {Math.min(currentStep + 1, 3)} of 3
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Progress Bar --- */}
          {currentStep < 3 && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ ease: "easeInOut", duration: 0.5 }}
              />
            </div>
          )}

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
            <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              {currentStep === 0 && (
                <button onClick={handleClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  Cancel
                </button>
              )}

              {currentStep > 0 && currentStep < 3 && (
                <button onClick={() => setCurrentStep(s => s - 1)} className="w-24 sm:flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 text-sm">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              {currentStep < 2 && (
                <button onClick={() => setCurrentStep(s => s + 1)} className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {currentStep === 2 && (
                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Store'}
                </button>
              )}

              {currentStep === 4 && (
                <button onClick={handleClose} className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity shadow-lg">
                  Done
                </button>
              )}
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
