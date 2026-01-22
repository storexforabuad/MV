"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyVendorByPhone } from '@/app/actions/vendorActions';
import { useVendor } from '@/context/VendorContext';
import { getAttemptState, recordFailure, clearAttempts, formatMs, DEFAULT_MAX_ATTEMPTS, DEFAULT_WINDOW_MS } from '@/utils/attempts';
import Confetti, { DEFAULT_CONFETTI_DURATION, prefersReducedMotion } from '@/components/Confetti';

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

  const ATTEMPT_MAX = DEFAULT_MAX_ATTEMPTS;
  const ATTEMPT_WINDOW = DEFAULT_WINDOW_MS;
  const attemptKey = storeId || 'global-vendor';
  const [attemptState, setAttemptState] = useState(() => getAttemptState(attemptKey, ATTEMPT_WINDOW, ATTEMPT_MAX));
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setAttemptState(getAttemptState(attemptKey, ATTEMPT_WINDOW, ATTEMPT_MAX));
    let timer: number | undefined;
    if (attemptState.locked && attemptState.retryAfterMs > 0) {
      timer = window.setInterval(() => {
        setAttemptState(getAttemptState(attemptKey, ATTEMPT_WINDOW, ATTEMPT_MAX));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

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
    // check attempts first
    const pre = getAttemptState(attemptKey, ATTEMPT_WINDOW, ATTEMPT_MAX);
    if (pre.locked) {
      toast.error(`Too many attempts. Try again in ${formatMs(pre.retryAfterMs)}`);
      setAttemptState(pre);
      return;
    }
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
        clearAttempts(attemptKey);
        setStep('success');
        setShowConfetti(true);
        toast.success('Smells perfect — come taste the food!');
        // wait for confetti duration then navigate
        const delay = prefersReducedMotion() ? 200 : DEFAULT_CONFETTI_DURATION + 100;
        setTimeout(() => {
          onSuccess(res.vendor);
        }, delay);
      } else {
        const after = recordFailure(attemptKey, ATTEMPT_WINDOW, ATTEMPT_MAX);
        setAttemptState(after);
        if (after.locked) {
          toast.error(`Too many attempts. Try again in ${formatMs(after.retryAfterMs)}`);
        } else {
          toast.error('Number not registered for this store');
        }
        setStep('input');
      }
    } catch (err) {
      const after = recordFailure(attemptKey, ATTEMPT_WINDOW, ATTEMPT_MAX);
      setAttemptState(after);
      if (after.locked) {
        toast.error(`Too many attempts. Try again in ${formatMs(after.retryAfterMs)}`);
      } else {
        toast.error('Lookup failed');
      }
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        {step !== 'success' && (
          <button onClick={handleClose} className="absolute top-3 right-3 p-2 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
            <X />
          </button>
        )}
        {showConfetti && <Confetti active duration={DEFAULT_CONFETTI_DURATION} particleCount={60} />}
        {step === 'input' && (
          <div>
            <h3 className="text-2xl font-bold mb-2">Mama’s Secret Recipe</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Whisper the special ingredient and the kitchen opens.</p>
            {attemptState.locked && (
              <div className="mb-3 text-sm text-red-600 dark:text-red-400">Pot on low — try again in {formatMs(attemptState.retryAfterMs)}.</div>
            )}
            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-xl p-3 mb-4">
              <Search className="mr-3 text-gray-400 dark:text-gray-300" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Name the ingredient" className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200" />
            </div>
            <button onClick={handleSubmit} disabled={isLoading || attemptState.locked} className="w-full bg-slate-800 text-white py-3 rounded-xl">
              {isLoading ? 'Stirring...' : 'Serve it'}
            </button>
          </div>
        )}
        {step === 'lookup' && (
          <div className="flex flex-col items-center py-8">
            <Loader className="animate-spin text-indigo-600" size={48} />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Stirring the pot…</p>
          </div>
        )}
        {step === 'success' && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="text-green-500" size={48} />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Smells perfect — come taste the food!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
