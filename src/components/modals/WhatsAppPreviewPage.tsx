'use client';

import { MessageSquare, ExternalLink, ArrowLeft, AlertCircle } from 'lucide-react';

interface WhatsAppPreviewPageProps {
    message: string;
    onConfirm: () => void;
    onBack: () => void;
    isPlacingOrder: boolean;
}

export default function WhatsAppPreviewPage({ message, onConfirm, onBack, isPlacingOrder }: WhatsAppPreviewPageProps) {
    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-grow space-y-6">
                {/* Back Button at Top */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Summary</span>
                </button>

                {/* Header/Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold">Ready to send!</p>
                        <p className="mt-1">We'll redirect you to WhatsApp to complete your order. Please make sure to allow pop-ups if prompted.</p>
                    </div>
                </div>

                {/* WhatsApp Preview Bubble */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                        Message Preview
                    </label>
                    <div className="relative bg-[#E7FFDB] dark:bg-[#054740] rounded-2xl rounded-tl-none p-4 shadow-sm border border-[#d1eec0] dark:border-[#075e54]">
                        {/* WhatsApp Bubble Tail */}
                        <div className="absolute -left-2 top-0 w-0 h-0 border-t-[12px] border-t-[#E7FFDB] dark:border-t-[#054740] border-l-[12px] border-l-transparent" />

                        <div className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-100 font-sans leading-relaxed">
                            {message}
                        </div>

                        <div className="mt-2 flex justify-end items-center gap-1 text-[10px] text-gray-500 dark:text-gray-300">
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="flex -space-x-1">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                                    <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10.5 4.5L6.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
