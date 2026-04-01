'use client';

import { useState } from 'react';
import { Share2, Loader2, Check, Copy } from 'lucide-react';
import { saveSharedWishlist } from '@/lib/db';
import { CartItem } from '@/lib/cartContext';
import toast from 'react-hot-toast';

interface WishlistShareButtonProps {
    items: CartItem[];
}

export default function WishlistShareButton({ items }: WishlistShareButtonProps) {
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const fallbackCopyToClipboard = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure it's not visible
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                setIsCopied(true);
                toast.success('Link copied to clipboard!');
                setTimeout(() => setIsCopied(false), 3000);
            } else {
                toast.error('Unable to copy link.');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            toast.error('Unable to copy link.');
        }

        document.body.removeChild(textArea);
    };

    const handleShare = async () => {
        if (items.length === 0) {
            toast.error('Your cart is empty!');
            return;
        }

        setIsSharing(true);
        try {
            const id = await saveSharedWishlist(items);
            const url = `https://tinyurl.com/thelinkinmybio/wishlist/${id}`;
            setShareUrl(url);

            if (navigator.share) {
                await navigator.share({
                    title: 'My Cart',
                    text: 'Check out the items in my cart!',
                    url: url,
                });
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                setIsCopied(true);
                toast.success('Link copied to clipboard!');
                setTimeout(() => setIsCopied(false), 3000);
            } else {
                fallbackCopyToClipboard(url);
            }
        } catch (error) {
            console.error('Failed to share cart:', error);
            if (error instanceof Error && error.name !== 'AbortError') {
                toast.error('Failed to generate share link.');
            }
        } finally {
            setIsSharing(false);
        }
    };

    const copyToClipboard = async () => {
        if (!shareUrl) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setIsCopied(true);
                toast.success('Link copied to clipboard!');
                setTimeout(() => setIsCopied(false), 3000);
            } catch (err) {
                fallbackCopyToClipboard(shareUrl);
            }
        } else {
            fallbackCopyToClipboard(shareUrl);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={handleShare}
                disabled={isSharing || items.length === 0}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 transform-gpu active:scale-[0.98] disabled:opacity-50"
            >
                {isSharing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                ) : (
                    <Share2 className="w-4 h-4 text-text-secondary group-hover:text-red-500 transition-colors" />
                )}
                <span className="text-sm font-medium text-text-primary">Share Cart</span>
            </button>

            {shareUrl && !navigator.share && (
                <button
                    onClick={copyToClipboard}
                    className="text-[10px] text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
                >
                    {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? 'Copied!' : 'Copy Link'}
                </button>
            )}
        </div>
    );
}
