'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/db';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Loader2, Building2, User, MapPin, CreditCard, X, ChevronRight, Store } from 'lucide-react';
import { StoreMeta } from '@/types/store';

interface AccountModalProps {
  isOpen: boolean;
  handleClose: () => void;
  storeId: string;
}

type Section = 'business' | 'ceo' | 'address' | 'bank';

export default function AccountModal({ isOpen, handleClose, storeId }: AccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('business');

  // Form State
  const [formData, setFormData] = useState<Partial<StoreMeta>>({});

  useEffect(() => {
    if (!storeId || !isOpen) return;
    let mounted = true;
    (async () => {
      try {
        setFetching(true);
        const ref = doc(db, 'stores', storeId);
        const snap = await getDoc(ref);
        if (snap.exists() && mounted) {
          setFormData(snap.data() as StoreMeta);
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

  const handleSave = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const ref = doc(db, 'stores', storeId);
      // Filter out undefined values to avoid Firestore errors
      const dataToUpdate = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      await updateDoc(ref, dataToUpdate);
      toast.success('Account details saved successfully');
      handleClose();
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

  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: 'business', label: 'Business Profile', icon: Store },
    { id: 'ceo', label: 'CEO Details', icon: User },
    { id: 'address', label: 'Physical Address', icon: MapPin },
    { id: 'bank', label: 'Bank Account', icon: CreditCard },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white sm:p-4 md:p-6"
          initial="hidden" animate="visible" exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="flex-grow flex flex-col sm:flex-row bg-white dark:bg-slate-900 sm:rounded-2xl sm:shadow-2xl overflow-hidden max-w-6xl mx-auto w-full h-full sm:h-[90vh] sm:max-h-[800px]">

            {/* --- Sidebar Navigation --- */}
            <aside className="w-full sm:w-64 bg-slate-50 dark:bg-slate-900/50 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
                  <p className="text-xs text-slate-500">Manage store profile</p>
                </div>
                <button onClick={handleClose} className="sm:hidden p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-grow overflow-x-auto sm:overflow-y-auto flex sm:flex-col p-2 sm:p-4 gap-2 scrollbar-hide">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 sm:w-full ${activeSection === section.id
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                    {section.label}
                    {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto hidden sm:block opacity-50" />}
                  </button>
                ))}
              </nav>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-grow flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
              {/* Header for Desktop */}
              <div className="hidden sm:flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{sections.find(s => s.id === activeSection)?.label}</h3>
                  <p className="text-sm text-slate-500">Update your information below</p>
                </div>
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 sm:p-8">
                {fetching ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-8 pb-20 sm:pb-0">

                    {/* --- Business Profile Section --- */}
                    {activeSection === 'business' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Store Name <span className="text-xs text-slate-400 font-normal ml-1">(Read-only)</span></label>
                          <input
                            value={formData.name || ''}
                            readOnly
                            className="w-full p-3.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Business Description</label>
                          <textarea
                            value={formData.businessDescription || ''}
                            onChange={e => updateField('businessDescription', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px]"
                            placeholder="Tell customers what your business is about..."
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Number</label>
                            <input
                              value={formData.whatsapp || ''}
                              onChange={e => updateField('whatsapp', e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="e.g. +234..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Instagram Handle</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-3.5 text-slate-400">@</span>
                              <input
                                value={formData.businessInstagram || ''}
                                onChange={e => updateField('businessInstagram', e.target.value)}
                                className="w-full p-3.5 pl-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CEO Full Name</label>
                          <input
                            value={formData.ceoName || ''}
                            onChange={e => updateField('ceoName', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                            <input
                              value={formData.ceoEmail || ''}
                              onChange={e => updateField('ceoEmail', e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="john@example.com"
                              type="email"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                            <input
                              value={formData.ceoPhone || ''}
                              onChange={e => updateField('ceoPhone', e.target.value)}
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="e.g. 080..."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CEO Instagram</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-slate-400">@</span>
                            <input
                              value={formData.ceoInstagram || ''}
                              onChange={e => updateField('ceoInstagram', e.target.value)}
                              className="w-full p-3.5 pl-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="username"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- Address Section --- */}
                    {activeSection === 'address' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
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
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        {formData.hasPhysicalShop && (
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shop Number</label>
                                <input
                                  value={formData.shopNumber || ''}
                                  onChange={e => updateField('shopNumber', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. Shop B24"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Plaza/Building Name</label>
                                <input
                                  value={formData.plazaBuildingName || ''}
                                  onChange={e => updateField('plazaBuildingName', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. Emab Plaza"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Street Address</label>
                              <input
                                value={formData.streetAddress || ''}
                                onChange={e => updateField('streetAddress', e.target.value)}
                                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. 123 Adetokunbo Ademola Crescent"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                                <input
                                  value={formData.state || ''}
                                  onChange={e => updateField('state', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. Abuja"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                                <input
                                  value={formData.country || ''}
                                  onChange={e => updateField('country', e.target.value)}
                                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="e.g. Nigeria"
                                />
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
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Name</label>
                          <input
                            value={formData.bankAccountName || ''}
                            onChange={e => updateField('bankAccountName', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Number</label>
                          <input
                            value={formData.bankAccountNumber || ''}
                            onChange={e => updateField('bankAccountNumber', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. 0123456789"
                            type="text"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bank Name</label>
                          <input
                            value={formData.bankName || ''}
                            onChange={e => updateField('bankName', e.target.value)}
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. First Bank"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* --- Footer --- */}
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4 sticky bottom-0 z-10">
                <button
                  onClick={handleClose}
                  className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-6 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || fetching}
                  className="flex-[2] sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
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
