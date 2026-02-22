'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Loader2, AlertCircle, CheckCircle2, Timer } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { saveAdminSession } from '@/lib/adminSession';

interface PinEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

export default function PinEntryModal({ isOpen, onClose, storeId }: PinEntryModalProps) {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const isMountedRef = useRef(true);
    const lockoutRef = useRef<NodeJS.Timeout | null>(null);

    // Client-only mount guard for portal
    useEffect(() => {
        isMountedRef.current = true;
        setMounted(true);
        return () => {
            isMountedRef.current = false;
            if (lockoutRef.current) clearInterval(lockoutRef.current);
        };
    }, []);

    // Reset state when modal opens/closes & manage body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Prefetch admin route the moment the modal opens
            if (storeId) router.prefetch(`/admin/${storeId}`);
        } else {
            document.body.style.overflow = '';
            // Small delay before resetting so exit animation can play
            const t = setTimeout(() => {
                if (!isMountedRef.current) return;
                setPin('');
                setError(false);
                setSuccess(false);
                setFailedAttempts(0);
                setLockoutSeconds(0);
                if (lockoutRef.current) {
                    clearInterval(lockoutRef.current);
                    lockoutRef.current = null;
                }
            }, 300);
            return () => clearTimeout(t);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const startLockout = () => {
        setLockoutSeconds(LOCKOUT_SECONDS);
        lockoutRef.current = setInterval(() => {
            setLockoutSeconds(prev => {
                if (prev <= 1) {
                    if (lockoutRef.current) clearInterval(lockoutRef.current);
                    lockoutRef.current = null;
                    setError(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handlePinInput = (digit: string) => {
        if (pin.length < 4 && !loading && lockoutSeconds === 0) {
            const newPin = pin + digit;
            setPin(newPin);
            setError(false);
            if (newPin.length === 4) {
                verifyPin(newPin);
            }
        }
    };

    const handleBackspace = () => {
        if (!loading && lockoutSeconds === 0) {
            setPin(pin.slice(0, -1));
            setError(false);
        }
    };

    const verifyPin = async (enteredPin: string) => {
        if (!storeId) {
            console.error('[PIN] storeId is missing');
            setError(true);
            setPin('');
            return;
        }

        setLoading(true);
        setError(false);

        // 10-second timeout for the Firestore call to prevent infinite spinner
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Verification timeout')), 10000)
        );

        try {
            console.log(`[PIN] Verifying for store: ${storeId}`);
            const storeRef = doc(db, 'stores', storeId);

            // Race getDoc against a 10s timeout
            const storeSnap = (await Promise.race([
                getDoc(storeRef),
                timeoutPromise
            ])) as any;

            let correctPin = '0000';

            if (storeSnap && storeSnap.exists()) {
                const storeData = storeSnap.data();
                correctPin = storeData.adminPin || '0000';
                console.log('[PIN] Store doc found, using stored PIN');
            } else {
                console.warn('[PIN] Store doc not found, falling back to default 0000');
            }

            // Standardize both to strings for comparison
            if (String(correctPin) === String(enteredPin)) {
                console.log('[PIN] Success!');

                saveAdminSession(storeId);
                setSuccess(true);
                setLoading(false);

                // Haptic on success
                try {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        navigator.vibrate([30, 50, 30]);
                    }
                } catch (e) { }

                setTimeout(() => {
                    // Only push if we are still actually mounted
                    if (isMountedRef.current) {
                        router.push(`/admin/${storeId}`);
                        onClose();
                    }
                }, 800);
                return;
            }

            // Wrong PIN
            console.warn('[PIN] Incorrect PIN entered');
            if (!isMountedRef.current) return;
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);
            setError(true);
            setPin('');

            try {
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate([40, 60, 40]);
                }
            } catch (e) { }

            if (newAttempts >= MAX_ATTEMPTS) {
                startLockout();
            }
        } catch (err) {
            console.error('[PIN] Verification error:', err);
            setError(true);
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    const isLocked = lockoutSeconds > 0;
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    // Determine dot state
    const dotState = success ? 'success' : error ? 'error' : 'normal';

    // Do not render until client-side mount (prevents SSR hydration mismatch)
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — separate from modal, not a stacking context issue */}
                    <motion.div
                        key="pin-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9998,
                            background: 'rgba(15,23,42,0.85)',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                        }}
                        onClick={!loading && !success ? onClose : undefined}
                    />

                    {/* Centering container — pointerEvents none so backdrop clicks go through */}
                    <div
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '16px', pointerEvents: 'none',
                        }}
                    >
                        <motion.div
                            key="pin-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 12 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ pointerEvents: 'auto', width: '100%', maxWidth: '340px', position: 'relative' }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 flex flex-col items-center">

                                {/* Icon — changes on success */}
                                <motion.div
                                    animate={success ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300 ${success
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-indigo-100 dark:bg-indigo-900/30'
                                        }`}
                                >
                                    {success
                                        ? <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                                        : <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                                    }
                                </motion.div>

                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                    {success ? 'Access Granted' : 'Admin Access'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
                                    {success
                                        ? 'Redirecting to Control Center…'
                                        : isLocked
                                            ? 'Too many failed attempts'
                                            : 'Enter your 4-digit PIN to continue'
                                    }
                                </p>

                                {/* PIN dots */}
                                <div className="flex gap-5 mb-5">
                                    {[...Array(4)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={
                                                dotState === 'error'
                                                    ? { x: [0, -4, 4, -4, 4, 0] }
                                                    : dotState === 'success'
                                                        ? { scale: [1, 1.3, 1] }
                                                        : {}
                                            }
                                            transition={{ duration: 0.3, delay: i * 0.05 }}
                                            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${success
                                                ? 'bg-green-500 border-green-500 scale-110 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                                : pin.length > i
                                                    ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-[0_0_10px_rgba(79,70,229,0.5)]'
                                                    : error
                                                        ? 'border-red-400 bg-red-400/20'
                                                        : 'border-slate-300 dark:border-slate-700'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Error message */}
                                {error && !isLocked && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 text-red-500 text-xs font-medium mb-4"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>
                                            Incorrect PIN.{' '}
                                            {MAX_ATTEMPTS - failedAttempts > 0
                                                ? `${MAX_ATTEMPTS - failedAttempts} attempt${MAX_ATTEMPTS - failedAttempts !== 1 ? 's' : ''} remaining.`
                                                : ''}
                                        </span>
                                    </motion.div>
                                )}

                                {/* Lockout countdown */}
                                {isLocked && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium mb-4 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/50"
                                    >
                                        <Timer className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Too many attempts. Try again in <strong>{lockoutSeconds}s</strong>.</span>
                                    </motion.div>
                                )}

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-3 w-full">
                                    {digits.map(digit => (
                                        <button
                                            key={digit}
                                            onClick={() => handlePinInput(digit)}
                                            disabled={loading || isLocked || success}
                                            className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed select-none"
                                        >
                                            {digit}
                                        </button>
                                    ))}
                                    <div />
                                    <button
                                        onClick={() => handlePinInput('0')}
                                        disabled={loading || isLocked || success}
                                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed select-none"
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handleBackspace}
                                        disabled={loading || isLocked || success || pin.length === 0}
                                        className="h-14 rounded-2xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Loading overlay */}
                            {loading && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                </div>
                            )}

                            {/* Close button */}
                            {!success && (
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
