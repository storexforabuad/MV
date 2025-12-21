"use client";

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyVendorByPhone } from '@/app/actions/vendorActions';
import { useVendor } from '@/context/VendorContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  storeId?: string;
  onSuccess: (vendor: any) => void;
}

export default function VendorLookupModal({ isOpen, onClose, storeId, onSuccess }: Props) {
  const [step, setStep] = useState<'input' | 'lookup' | 'success'>('input');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setVendor } = useVendor();

  const reset = () => {
    setPhone('');
    setStep('input');
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    let processed = phone.replace(/\D/g, '');
    if (processed.length === 11 && processed.startsWith('0')) processed = processed.substring(1);
    if (processed.length !== 10 && !phone.startsWith('+')) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    const formatted = phone.startsWith('+') ? phone : `+234${processed}`;

    setIsLoading(true);
    setStep('lookup');
    try {
      const res = await verifyVendorByPhone(storeId || '', formatted);
      if (res.success && res.vendor) {
        setVendor(res.vendor);
        setStep('success');
        toast.success('Verified — opening admin...');
        onSuccess(res.vendor);
      } else {
        toast.error('Number not registered for this store');
        setStep('input');
      }
    } catch (err) {
      toast.error('Lookup failed');
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full text-gray-500 hover:text-gray-800">
          <X />
        </button>
        {step === 'input' && (
          <div>
            <h3 className="text-2xl font-bold mb-2">Vendor sign in</h3>
            <p className="text-sm text-gray-500 mb-4">Enter the WhatsApp number associated with this store.</p>
            <div className="flex items-center bg-gray-100 rounded-xl p-3 mb-4">
              <Search className="mr-3 text-gray-400" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0802 345 6789 or +2348023456789" className="w-full bg-transparent outline-none" />
            </div>
            <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-slate-800 text-white py-3 rounded-xl">
              {isLoading ? 'Checking...' : 'Lookup'}
            </button>
          </div>
        )}
        {step === 'lookup' && (
          <div className="flex flex-col items-center py-8">
            <Loader className="animate-spin text-indigo-600" size={48} />
            <p className="mt-4 text-gray-600">Looking up vendor...</p>
          </div>
        )}
        {step === 'success' && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="text-green-500" size={48} />
            <p className="mt-4 text-gray-600">Verified — redirecting...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
