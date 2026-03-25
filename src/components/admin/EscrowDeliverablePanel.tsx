'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, Clock, Unlock, Video, Image, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadEscrowDeliverable, releaseEscrow } from '@/app/actions/orderActions';

interface EscrowDeliverablePanelProps {
    orderId: string;
    storeId: string;
    isInfluencerView: boolean; // true = influencer (admin), false = brand (customer order view)
    paymentStatus?: string;
    orderStatus?: string;
    deliverableUrl?: string;
    onUpdate?: () => void;
}

export default function EscrowDeliverablePanel({
    orderId,
    storeId,
    isInfluencerView,
    paymentStatus,
    orderStatus,
    deliverableUrl: initialDeliverableUrl,
    onUpdate,
}: EscrowDeliverablePanelProps) {
    const [deliverableUrl, setDeliverableUrl] = useState(initialDeliverableUrl || '');
    const [influencerNote, setInfluencerNote] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isReleasing, setIsReleasing] = useState(false);
    const [cloudinaryFile, setCloudinaryFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploaded, setUploaded] = useState(!!initialDeliverableUrl);

    const isEscrowHeld = paymentStatus === 'escrow-held';
    const isPendingReview = orderStatus === 'pending-review';
    const isReleased = paymentStatus === 'escrow-released';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setCloudinaryFile(e.target.files[0]);
        }
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        formData.append('folder', `bizconnet/deliverables/${storeId}`);

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Cloudinary upload failed');
        const data = await response.json();
        return data.secure_url;
    };

    const handleSubmitDeliverable = async () => {
        if (!cloudinaryFile && !deliverableUrl.trim()) {
            toast.error('Please select a file or enter a URL');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            let finalUrl = deliverableUrl;

            if (cloudinaryFile) {
                setUploadProgress(30);
                finalUrl = await uploadToCloudinary(cloudinaryFile);
                setUploadProgress(80);
            }

            const result = await uploadEscrowDeliverable(storeId, orderId, finalUrl, influencerNote);

            if (result.success) {
                setDeliverableUrl(finalUrl);
                setUploaded(true);
                setUploadProgress(100);
                toast.success('Deliverable submitted! Awaiting brand approval.');
                onUpdate?.();
            } else {
                toast.error(result.error || 'Upload failed');
            }
        } catch (err) {
            toast.error('Upload failed. Please try again.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleReleaseEscrow = async () => {
        if (!window.confirm('Approve and release escrow funds to the influencer?')) return;
        setIsReleasing(true);
        try {
            const result = await releaseEscrow(storeId, orderId);
            if (result.success) {
                toast.success('✅ Escrow released! Influencer will receive payment.');
                onUpdate?.();
            } else {
                toast.error(result.error || 'Failed to release escrow');
            }
        } catch (err) {
            toast.error('Could not release escrow. Please try again.');
        } finally {
            setIsReleasing(false);
        }
    };

    const getFileIcon = (url: string) => {
        if (url.match(/\.(mp4|mov|webm|avi)/i)) return <Video className="w-5 h-5" />;
        if (url.match(/\.(jpg|jpeg|png|gif|webp)/i)) return <Image className="w-5 h-5" />;
        return <FileText className="w-5 h-5" />;
    };

    // Status Badge
    const StatusBadge = () => {
        if (isReleased) return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold">
                <CheckCircle size={12} /> Escrow Released
            </span>
        );
        if (isPendingReview) return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                <Clock size={12} /> Pending Brand Approval
            </span>
        );
        if (isEscrowHeld) return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold">
                <Unlock size={12} /> Funds in Escrow
            </span>
        );
        return null;
    };

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Unlock size={16} className="text-blue-500" />
                    Escrow & Deliverable
                </h3>
                <StatusBadge />
            </div>

            {/* Deliverable Preview (if uploaded) */}
            <AnimatePresence>
                {deliverableUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
                    >
                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                            {getFileIcon(deliverableUrl)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">Deliverable uploaded</p>
                            <p className="text-[10px] text-gray-400 truncate">{deliverableUrl}</p>
                        </div>
                        <a
                            href={deliverableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 transition-colors"
                        >
                            <ExternalLink size={16} />
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Influencer Upload Panel */}
            {isInfluencerView && isEscrowHeld && !isPendingReview && !isReleased && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload the campaign deliverable (video/image/link) to submit for brand approval.
                    </p>

                    {/* File Upload */}
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-white dark:bg-gray-800">
                        <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {cloudinaryFile ? cloudinaryFile.name : 'Click to upload video, image, or document'}
                        </span>
                        <input type="file" accept="video/*,image/*,.pdf" className="hidden" onChange={handleFileChange} />
                    </label>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                        <span>or paste a URL</span>
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    </div>

                    <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={deliverableUrl}
                        onChange={(e) => setDeliverableUrl(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                    />

                    <textarea
                        placeholder="Add a note for the brand (optional)..."
                        value={influencerNote}
                        onChange={(e) => setInfluencerNote(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
                    />

                    {isUploading && uploadProgress < 100 && (
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}

                    <button
                        onClick={handleSubmitDeliverable}
                        disabled={isUploading}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                        ) : (
                            <><Upload size={16} /> Submit Deliverable</>
                        )}
                    </button>
                </div>
            )}

            {/* Brand Approval Panel */}
            {!isInfluencerView && isPendingReview && !isReleased && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                        <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            The influencer has submitted the campaign deliverable. Review it and approve to release payment.
                        </p>
                    </div>

                    <button
                        onClick={handleReleaseEscrow}
                        disabled={isReleasing}
                        className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isReleasing ? (
                            <><Loader2 size={16} className="animate-spin" /> Releasing...</>
                        ) : (
                            <><CheckCircle size={16} /> Approve & Release Escrow</>
                        )}
                    </button>
                </motion.div>
            )}

            {/* Released state */}
            {isReleased && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800"
                >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">Escrow Released</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Payment has been released to the influencer.</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
