'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/db';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreMeta } from '@/types/store';
import { geography } from '../../../config/geography';
import { uploadImageToCloudinary } from "../../../lib/cloudinaryClient";
import { compressImage } from "../../../utils/imageCompression";
import Image from "next/image";
import { Briefcase, Loader2, User, MapPin, CreditCard, Store, ChevronRight, X, Lock, ImagePlus, ShieldCheck } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  handleClose: () => void;
  storeId: string;
}

type Section = 'business' | 'ceo' | 'address' | 'bank' | 'security';

// ─── SecuritySection sub-component ────────────────────────────────────────────
function SecuritySection({
  formData,
  updateField,
}: {
  formData: Partial<any>;
  updateField: (key: keyof StoreMeta, value: any) => void;
}) {
  const hasExistingPin = !!(formData.adminPin && formData.adminPin.length === 4);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePinChange = (val: string) => {
    setNewPin(val);
    setPinError('');
    if (confirmPin && val !== confirmPin) {
      setPinError('PINs do not match');
    } else if (confirmPin && val === confirmPin && val.length === 4) {
      updateField('adminPin', val);
      setPinError('');
    }
  };

  const handleConfirmChange = (val: string) => {
    setConfirmPin(val);
    setPinError('');
    if (newPin && val !== newPin && val.length === 4) {
      setPinError('PINs do not match');
    } else if (newPin && val === newPin && val.length === 4) {
      updateField('adminPin', val);
      setPinError('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
        <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
          Set a 4-digit PIN to secure your administrative access. Triple-tap your store name on the storefront to enter it.
        </p>
      </div>

      {hasExistingPin && !changingPin ? (
        // Masked display — PIN is already set
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Admin Access PIN</label>
          <div className="flex items-center gap-3">
            <div className="flex gap-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setChangingPin(true);
                setNewPin('');
                setConfirmPin('');
                setPinError('');
              }}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Change PIN
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">PIN is set. Tap &ldquo;Change PIN&rdquo; to update it.</p>
        </div>
      ) : (
        // New PIN entry with confirmation
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              {hasExistingPin ? 'New PIN' : 'Admin Access PIN'}
            </label>
            <div className="relative max-w-[200px]">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={e => handlePinChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full p-3.5 pl-10 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all tracking-[1em] text-lg font-bold"
                placeholder="••••"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Confirm PIN</label>
            <div className="relative max-w-[200px]">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={e => handleConfirmChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={`w-full p-3.5 pl-10 bg-slate-50 dark:bg-zinc-950 border rounded-xl focus:ring-2 outline-none transition-all tracking-[1em] text-lg font-bold ${pinError
                  ? 'border-red-400 focus:ring-red-400'
                  : newPin && confirmPin && newPin === confirmPin && newPin.length === 4
                    ? 'border-green-400 focus:ring-green-400'
                    : 'border-slate-200 dark:border-zinc-800 focus:ring-indigo-500'
                  }`}
                placeholder="••••"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            {pinError && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{pinError}</p>
            )}
            {!pinError && newPin && confirmPin && newPin === confirmPin && newPin.length === 4 && (
              <p className="mt-1.5 text-xs text-green-600 font-medium">✓ PINs match</p>
            )}
          </div>

          {hasExistingPin && (
            <button
              type="button"
              onClick={() => { setChangingPin(false); setNewPin(''); setConfirmPin(''); }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:-zinc-300"
            >
              Cancel
            </button>
          )}
          <p className="text-xs text-slate-500">Enter exactly 4 digits. Default is 0000.</p>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
export default function AccountModal({ isOpen, handleClose, storeId }: AccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('business');

  // Form State
  const [formData, setFormData] = useState<Partial<StoreMeta>>({});
  const [initialData, setInitialData] = useState<Partial<StoreMeta>>({});
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [fetchingBanks, setFetchingBanks] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!storeId || !isOpen) return;
    let mounted = true;

    // Fetch banks
    (async () => {
      try {
        setFetchingBanks(true);
        const res = await fetch('/api/paystack/banks');
        const data = await res.json();
        if (data.banks && mounted) {
          setBanks(data.banks);
        }
      } catch (err) {
        console.error('Failed to fetch banks', err);
      } finally {
        if (mounted) setFetchingBanks(false);
      }
    })();

    (async () => {
      try {
        setFetching(true);
        const ref = doc(db, 'stores', storeId);
        const snap = await getDoc(ref);
        if (snap.exists() && mounted) {
          const data = snap.data() as StoreMeta;
          setFormData(data);
          setInitialData(data);

          if (data.adminPin === '0000') {
            setActiveSection('security');
          } else {
            // Reset to business if opened again and pin is not 0000 (though we mount/unmount the modal)
            setActiveSection('business');
          }
        }
      } catch (err) {
        console.error('Failed to load account info', err);
        toast.error('Failed to load store details');
      } finally {
        if (mounted) setFetching(false);
      }
    })();
    return () => { mounted = false; };
  }, [storeId, isOpen]);

  useEffect(() => {
    if (formData.logo) {
      setLogoPreview(formData.logo);
    }
  }, [formData.logo]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      let finalLogo = formData.logo;

      if (logoFile) {
        try {
          const compressedFile = await compressImage(logoFile);
          finalLogo = await uploadImageToCloudinary(compressedFile, 'stores');
        } catch (err) {
          console.error('Logo upload failed', err);
          toast.error('Logo upload failed, but other changes will be saved');
        }
      }

      const ref = doc(db, 'stores', storeId);
      // Filter out undefined values to avoid Firestore errors
      const dataToUpdate = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      if (finalLogo) {
        dataToUpdate.logo = finalLogo;
      }

      await updateDoc(ref, dataToUpdate);

      // Update local state with new logo and other changes
      const updatedFormData = { ...formData, logo: finalLogo };
      setFormData(updatedFormData);
      setInitialData(updatedFormData);
      setLogoFile(null); // Clear pending file as it's now saved

      // Trigger Paystack Subaccount creation/update if bank details changed
      if (
        formData.bankAccountNumber &&
        formData.bankCode &&
        formData.name &&
        (formData.bankAccountNumber !== initialData.bankAccountNumber ||
          formData.bankCode !== initialData.bankCode)
      ) {
        try {
          const subRes = await fetch('/api/paystack/subaccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId,
              businessName: formData.name,
              settlementBank: formData.bankCode,
              accountNumber: formData.bankAccountNumber,
              subaccountCode: formData.paystackSubaccountCode
            })
          });
          const subData = await subRes.json();
          if (subData.status) {
            setFormData(prev => ({ ...prev, paystackSubaccountCode: subData.subaccount_code }));
            toast.success('Payout subaccount synchronized');
          } else {
            toast.error(`Payout sync failed: ${subData.error}`);
          }
        } catch (err) {
          console.error('Subaccount sync error', err);
        }
      }

      // State already updated above with updatedFormData
      toast.success('Account details saved successfully');
    } catch (err) {
      console.error('Failed to save account details', err);
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof StoreMeta, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setFormData(prev => ({ ...prev, country: newCountry, state: '' }));
  };

  // Check if form is dirty (has changes)
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData) || !!logoFile;

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: 'business', label: 'Business Profile', icon: Store },
    { id: 'ceo', label: 'CEO Details', icon: User },
    { id: 'address', label: 'Physical Address', icon: MapPin },
    { id: 'bank', label: 'Bank Account', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  const selectedCountry = geography.find(c => c.name === formData.country);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white sm:p-4 md:p-6 h-[100dvh] sm:h-auto overflow-hidden"
          initial="hidden" animate="visible" exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="flex-grow flex flex-col sm:flex-row bg-white dark:bg-zinc-900 sm:rounded-2xl sm:shadow-2xl overflow-hidden max-w-6xl mx-auto w-full h-full sm:h-[90vh] sm:max-h-[800px] min-h-0 sm:min-h-0">

            {/* --- Sidebar Navigation --- */}
            <aside className="w-full sm:w-64 bg-slate-50 dark:bg-zinc-900/50 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-zinc-800 flex-shrink-0 flex flex-col min-h-0">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Details</h2>
                  <p className="text-xs text-slate-500">Manage Account Details</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              <nav className="flex-grow overflow-x-auto sm:overflow-y-auto flex sm:flex-col p-2 sm:p-4 gap-1 sm:gap-2 scrollbar-hide">
                {sections.map(section => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center justify-center sm:justify-start gap-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 sm:w-full ${isActive
                        ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:-zinc-700 px-3 py-2 sm:p-3'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:-zinc-800/50 hover:text-slate-900 dark:-zinc-200 p-2 sm:p-3'
                        }`}
                    >
                      <section.icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="overflow-hidden whitespace-nowrap sm:hidden"
                          >
                            {section.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {/* Always show label on desktop sidebar */}
                      <span className="hidden sm:inline-block">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-grow flex flex-col min-w-0 min-h-0 bg-white dark:bg-zinc-900 relative">
              {/* Header for Desktop */}
              <div className="hidden sm:flex items-center justify-between p-6 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{sections.find(s => s.id === activeSection)?.label}</h3>
                  <p className="text-sm text-slate-500">Update your information below</p>
                </div>
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:-zinc-800 transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto min-h-0 p-4 sm:p-8">
                {fetching ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-8 pb-32 sm:pb-8">

                    {/* --- Business Profile Section --- */}
                    {activeSection === 'business' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Logo Upload UI */}
                        <div className="flex flex-col items-center justify-center py-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
                          <div
                            className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-all relative overflow-hidden group shadow-sm bg-slate-50 dark:bg-zinc-950"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {logoPreview ? (
                              <div className="relative w-full h-full">
                                <Image src={logoPreview} alt="Logo Preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImagePlus className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                <ImagePlus className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-medium">Upload Logo</span>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleLogoChange}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-3 font-medium">Tap to upload your store logo</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Store Name <span className="text-xs text-slate-400 font-normal ml-1">(Read-only)</span></label>
                          <input
                            value={formData.name || ''}
                            readOnly
                            className="w-full p-3.5 bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Business Description</label>
                          <textarea
                            value={formData.businessDescription || ''}
                            onChange={e => updateField('businessDescription', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px]"
                            placeholder="Tell customers what your business is about..."
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">WhatsApp Number</label>
                            <input
                              value={formData.whatsapp || ''}
                              onChange={e => updateField('whatsapp', e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="e.g. +234..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Instagram Handle</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-3.5 text-slate-400">@</span>
                              <input
                                value={formData.businessInstagram || ''}
                                onChange={e => updateField('businessInstagram', e.target.value)}
                                className="w-full p-3.5 pl-8 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="username"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- CEO Details Section --- */}
                    {activeSection === 'ceo' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">CEO Full Name</label>
                          <input
                            value={formData.ceoName || ''}
                            onChange={e => updateField('ceoName', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Email Address</label>
                            <input
                              value={formData.ceoEmail || ''}
                              onChange={e => updateField('ceoEmail', e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="john@example.com"
                              type="email"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
                            <input
                              value={formData.ceoPhone || ''}
                              onChange={e => updateField('ceoPhone', e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="e.g. 080..."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">CEO Instagram</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-slate-400">@</span>
                            <input
                              value={formData.ceoInstagram || ''}
                              onChange={e => updateField('ceoInstagram', e.target.value)}
                              className="w-full p-3.5 pl-8 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="username"
                            />
                          </div>
                        </div>

                        {formData.storeType === 'media-influencer' && (
                          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800 space-y-6">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Globe className="w-4 h-4 text-pink-500" /> Social Reach (Followers)
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">Let brands see your estimated reach across platforms.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Instagram Followers</label>
                                <input
                                  type="number"
                                  value={formData.socialStats?.instagramFollowers || ''}
                                  onChange={e => setFormData(prev => ({
                                    ...prev,
                                    socialStats: { ...prev.socialStats, instagramFollowers: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. 45000"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">TikTok Followers</label>
                                <input
                                  type="number"
                                  value={formData.socialStats?.tiktokFollowers || ''}
                                  onChange={e => setFormData(prev => ({
                                    ...prev,
                                    socialStats: { ...prev.socialStats, tiktokFollowers: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. 125000"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">YouTube Subscribers</label>
                                <input
                                  type="number"
                                  value={formData.socialStats?.youtubeSubscribers || ''}
                                  onChange={e => setFormData(prev => ({
                                    ...prev,
                                    socialStats: { ...prev.socialStats, youtubeSubscribers: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. 8500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">X/Twitter Followers</label>
                                <input
                                  type="number"
                                  value={formData.socialStats?.twitterFollowers || ''}
                                  onChange={e => setFormData(prev => ({
                                    ...prev,
                                    socialStats: { ...prev.socialStats, twitterFollowers: parseInt(e.target.value) || 0 }
                                  }))}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. 12000"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- Address Section --- */}
                    {activeSection === 'address' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">Physical Shop</h4>
                            <p className="text-xs text-slate-500">Do you have a physical store location?</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.hasPhysicalShop || false}
                              onChange={e => updateField('hasPhysicalShop', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:-zinc-600 peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {formData.hasPhysicalShop && (
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Shop Number</label>
                                <input
                                  value={formData.shopNumber || ''}
                                  onChange={e => updateField('shopNumber', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. Shop B24"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Plaza/Building Name</label>
                                <input
                                  value={formData.plazaBuildingName || ''}
                                  onChange={e => updateField('plazaBuildingName', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. Emab Plaza"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Street Address</label>
                              <input
                                value={formData.streetAddress || ''}
                                onChange={e => updateField('streetAddress', e.target.value)}
                                className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. 123 Adetokunbo Ademola Crescent"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Country</label>
                                <select
                                  value={formData.country || ''}
                                  onChange={handleCountryChange}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                  <option value="">Select your country</option>
                                  {geography.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">State</label>
                                <select
                                  value={formData.state || ''}
                                  onChange={e => updateField('state', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!formData.country}
                                >
                                  <option value="">Select state/province</option>
                                  {selectedCountry?.states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- Bank Account Section --- */}
                    {activeSection === 'bank' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                            Please provide accurate bank details to ensure smooth and timely payouts for your sales.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Account Name</label>
                          <input
                            value={formData.bankAccountName || ''}
                            onChange={e => updateField('bankAccountName', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Account Number</label>
                          <input
                            value={formData.bankAccountNumber || ''}
                            onChange={e => updateField('bankAccountNumber', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. 0123456789"
                            type="text"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Bank Name</label>
                          <select
                            value={formData.bankCode || ''}
                            onChange={e => {
                              const selectedBank = banks.find(b => b.code === e.target.value);
                              setFormData(prev => ({
                                ...prev,
                                bankCode: e.target.value,
                                bankName: selectedBank?.name || ''
                              }));
                            }}
                            className="w-full p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                            disabled={fetchingBanks}
                          >
                            <option value="">{fetchingBanks ? 'Loading banks...' : 'Select your bank'}</option>
                            {banks.map(bank => (
                              <option key={bank.code} value={bank.code}>{bank.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Payment Flow Toggle */}
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white">Paystack Escrow System</h4>
                              <p className="text-xs text-slate-500 mt-1 max-w-sm">Allow customers to pay securely via Paystack Escrow instead of manual WhatsApp transfers.</p>
                              <div className="mt-2.5 space-y-1.5 text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
                                <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Builds extreme customer trust & boosts sales.</p>
                                <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% protection from fake payment receipts.</p>
                                <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Automated payment verification.</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                              <input
                                type="checkbox"
                                checked={formData.paymentFlow === 'paystack_escrow'}
                                onChange={e => updateField('paymentFlow', e.target.checked ? 'paystack_escrow' : 'whatsapp')}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:-zinc-600 peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* --- Security Section --- */}
                    {activeSection === 'security' && (
                      <SecuritySection formData={formData} updateField={updateField} />
                    )}

                  </div>
                )}
              </div>

              {/* --- Footer --- */}
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-4 sticky bottom-0 z-10">
                <button
                  onClick={handleClose}
                  className="flex-1 sm:flex-none bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold py-3.5 px-6 rounded-xl transition-all hover:bg-slate-200 dark:-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || fetching || !isDirty}
                  className="flex-[2] sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
