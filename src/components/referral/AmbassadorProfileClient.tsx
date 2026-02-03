'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Key, Copy, Check,
    Save, ArrowLeft, Eye, EyeOff, Building2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { updateAmbassadorProfile, createPaystackSubaccount, AmbassadorProfile } from '@/app/actions/ambassadorActions';
import toast from 'react-hot-toast';

interface AmbassadorProfileClientProps {
    referralCode: string;
    initialProfile: AmbassadorProfile | null;
}

export default function AmbassadorProfileClient({
    referralCode,
    initialProfile
}: AmbassadorProfileClientProps) {
    const [profile, setProfile] = useState<AmbassadorProfile>(initialProfile || {
        referralCode,
        name: '',
        email: '',
        whatsapp: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showBankDetails, setShowBankDetails] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAmbassadorProfile(referralCode, profile);
            
            // If bank details are complete and no subaccount yet, create one
            if (
                profile.bankAccountNumber &&
                profile.bankCode &&
                profile.bankAccountName &&
                !profile.paystackSubaccountCode
            ) {
                const subaccountPromise = toast.promise(
                    createPaystackSubaccount(profile),
                    {
                        loading: 'Creating bank subaccount...',
                        success: 'Bank account verified and connected!',
                        error: (err: any) => err.error || 'Failed to create subaccount'
                    }
                );

                const result = await subaccountPromise;
                if (result.success && result.subaccountCode) {
                    setProfile(prev => ({
                        ...prev,
                        paystackSubaccountCode: result.subaccountCode
                    }));
                }
            } else {
                toast.success('Profile updated successfully!');
            }
            
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 pb-24">
            {/* Header */}
            <header className="p-6 pt-10 border-b border-slate-800 sticky top-0 z-50 bg-black/95 backdrop-blur">
                <div className="flex items-center justify-between">
                    <Link 
                        href={`/start/${referralCode}/dashboard`} 
                        className="p-2 hover:bg-slate-900 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-black">Ambassador Profile</h1>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2 bg-emerald-500 text-black rounded-lg font-bold text-sm hover:bg-emerald-400 transition-colors"
                    >
                        {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </div>
            </header>

            <div className="p-6 max-w-2xl mx-auto space-y-6">
                {/* Referral Code Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-bold text-slate-400 uppercase">Referral Code</span>
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                            {copySuccess ? (
                                <Check className="w-5 h-5 text-emerald-400" />
                            ) : (
                                <Copy className="w-5 h-5 text-emerald-400" />
                            )}
                        </button>
                    </div>
                    <div className="text-4xl font-black text-emerald-400 font-mono tracking-wider">
                        {referralCode}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Share this code with businesses to earn commission</p>
                </motion.div>

                {/* Profile Information */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4"
                >
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-400" />
                        Basic Information
                    </h2>

                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="Your full name"
                            />
                        ) : (
                            <div className="text-white font-bold">{profile.name || 'Not set'}</div>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </label>
                        {isEditing ? (
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="your.email@example.com"
                            />
                        ) : (
                            <div className="text-white font-bold">{profile.email || 'Not set'}</div>
                        )}
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            WhatsApp Number
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={profile.whatsapp}
                                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="+234901234567"
                            />
                        ) : (
                            <div className="text-white font-bold">{profile.whatsapp || 'Not set'}</div>
                        )}
                    </div>
                </motion.div>

                {/* Bank Details */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4"
                >
                    <button
                        onClick={() => setShowBankDetails(!showBankDetails)}
                        className="w-full flex items-center justify-between pb-4 border-b border-slate-800 hover:bg-slate-800/30 transition-colors px-2 py-1 rounded-lg"
                    >
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-amber-400" />
                            Bank Details
                        </h2>
                        <div className="flex items-center gap-2">
                            {profile.paystackSubaccountCode && (
                                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">Verified</span>
                            )}
                            {showBankDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </div>
                    </button>

                    <AnimatePresence>
                        {showBankDetails && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                {profile.paystackSubaccountCode && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-start gap-3">
                                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-emerald-100 font-bold">Account Verified</p>
                                            <p className="text-xs text-emerald-300/70">Your bank account is connected to Paystack for commission payouts</p>
                                        </div>
                                    </div>
                                )}

                                {!profile.paystackSubaccountCode && profile.bankAccountNumber && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-amber-100 font-bold">Pending Verification</p>
                                            <p className="text-xs text-amber-300/70">Save to verify your bank account</p>
                                        </div>
                                    </div>
                                )}

                                {/* Account Name */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Account Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profile.bankAccountName || ''}
                                            onChange={(e) => setProfile({ ...profile, bankAccountName: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="Name as per bank records"
                                        />
                                    ) : (
                                        <div className="text-white font-bold">{profile.bankAccountName || 'Not set'}</div>
                                    )}
                                </div>

                                {/* Account Number */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Account Number</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profile.bankAccountNumber || ''}
                                            onChange={(e) => setProfile({ ...profile, bankAccountNumber: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                                            placeholder="10-digit account number"
                                            maxLength={10}
                                        />
                                    ) : (
                                        <div className="text-white font-mono font-bold">{profile.bankAccountNumber || 'Not set'}</div>
                                    )}
                                </div>

                                {/* Bank Name */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Bank Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profile.bankName || ''}
                                            onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="e.g., GTBank, Access Bank"
                                        />
                                    ) : (
                                        <div className="text-white font-bold">{profile.bankName || 'Not set'}</div>
                                    )}
                                </div>

                                {/* Bank Code */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Bank Code</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profile.bankCode || ''}
                                            onChange={(e) => setProfile({ ...profile, bankCode: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                                            placeholder="3-digit code (e.g., 058)"
                                            maxLength={3}
                                        />
                                    ) : (
                                        <div className="text-white font-mono font-bold">{profile.bankCode || 'Not set'}</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Save Button */}
                {isEditing && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </motion.button>
                )}
            </div>
        </div>
    );
}
