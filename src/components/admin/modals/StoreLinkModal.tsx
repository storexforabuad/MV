"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Copy, Check, Lightbulb, Share2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Category } from '../../../types/category';

// --- PROPS INTERFACE ---
interface StoreLinkModalProps {
  isOpen: boolean;
  handleClose: () => void;
  storeLink: string;
  promoCaption?: string;
  storeName?: string;
  categories?: Category[];
}

// --- SOCIAL ICONS ---
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>;
const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>;
const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>;
const SnapchatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M22.972 13.447c-.436.033-.88.04-1.32.04-3.957 0-7.233-2.673-8.63-6.233-1.135-2.89.103-6.16.89-8.254.08-.204.01-.447-.16-.583-.18-.133-.42-.14-.59-.02C10.834.024 8.71 1.543 8.35 4.3c-1.004 7.64 4.933 14.867 12.65 15.67.28.03.55-.13.66-.4.12-.27.01-.58-.22-.72-1.92-1.18-3.05-3.2-3.4-5.4.49.03.98.05 1.47.05.51 0 1.02-.01 1.53-.04 1.1-.06 2.05-.18 2.05-.18s.22-.05.39-.21c.16-.17.18-.41.05-.61l-.01.01z"/></svg>;

// --- HELPER FUNCTIONS ---
const formatCategories = (categories: Category[] | undefined) => {
    if (!categories || categories.length === 0) return 'products';
    const categoryNames = categories.map(c => c.name);
    const count = categoryNames.length;
    if (count <= 5) {
        if (count === 1) return categoryNames[0];
        if (count === 2) return categoryNames.join(' and ');
        const last = categoryNames.pop();
        return `${categoryNames.join(', ')}, and ${last}`;
    }
    const firstFive = categoryNames.slice(0, 5);
    return `${firstFive.join(', ')}, and more products`;
};

// --- MAIN COMPONENT ---
const StoreLinkModal: React.FC<StoreLinkModalProps> = ({ isOpen, handleClose, storeLink, promoCaption, storeName, categories }) => {
    const [fullUrl, setFullUrl] = useState('');
    const [copyMessageState, setCopyMessageState] = useState(false);
    const [copyLinkState, setCopyLinkState] = useState(false);

    useEffect(() => {
        if (storeLink) {
            if (storeLink.startsWith('http')) {
                setFullUrl(storeLink);
            } else {
                const storeId = storeLink.startsWith('/') ? storeLink.substring(1) : storeLink;
                setFullUrl(`https://tinyurl.com/bizcononline/${storeId}`);
            }
        }
    }, [storeLink]);

    const handleCopy = (text: string, type: 'message' | 'link') => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === 'message') {
                setCopyMessageState(true);
                toast.success('Share message copied!');
                setTimeout(() => setCopyMessageState(false), 2000);
            } else {
                setCopyLinkState(true);
                toast.success('Store link copied!');
                setTimeout(() => setCopyLinkState(false), 2000);
            }
        });
    };

    const formattedCategories = formatCategories(categories);
    const defaultCaption = `🌟 Discover authentic ${formattedCategories} at affordable prices in the new ${storeName || 'Online Store'} Online Store! 🛒 -Powered by BizCon™ network. Tap the link below:`;
    const shareMessage = `${promoCaption || defaultCaption}\n${fullUrl}`;

    const socialPlatforms = [
        { name: 'WhatsApp', icon: WhatsAppIcon, url: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`, color: 'bg-[#25D366]' },
        { name: 'Facebook', icon: FacebookIcon, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(promoCaption || defaultCaption)}`, color: 'bg-[#1877F2]' },
        { name: 'Instagram', icon: InstagramIcon, action: () => {
            navigator.clipboard.writeText(fullUrl);
            toast.success('Link copied! Paste it in your Instagram story or bio.');
        }, color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500' },
        { name: 'Snapchat', icon: SnapchatIcon, action: () => {
            navigator.clipboard.writeText(fullUrl);
            toast.success('Link copied! Paste it in your Snapchat story.');
        }, color: 'bg-yellow-300' },
    ];

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen">
                    <div className="flex min-h-full items-end justify-center md:items-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="translate-y-full md:translate-y-0 md:scale-95" enterTo="translate-y-0 md:scale-100" leave="ease-in duration-200" leaveFrom="translate-y-0 md:scale-100" leaveTo="translate-y-full md:translate-y-0 md:scale-95">
                            <Dialog.Panel className="relative flex w-full flex-col bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 md:max-w-md md:rounded-2xl h-full md:h-auto md:max-h-[90vh]">

                                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 flex items-center gap-2"><Share2 size={20} />Share Your Store</Dialog.Title>
                                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                        <X size={24} className="text-slate-600 dark:text-slate-300" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                                    <div className="flex items-start gap-3 rounded-lg bg-sky-50 dark:bg-sky-900/50 border border-sky-200 dark:border-sky-800 p-3">
                                        <Lightbulb className="h-5 w-5 flex-shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                                        <p className="text-sm text-sky-800 dark:text-sky-200">Sharing your link is the best way to get more views and sales. Copy your message and share it everywhere!</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Your Share Message</label>
                                        <div className="relative rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 pr-20">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">{shareMessage}</p>
                                            <button onClick={() => handleCopy(shareMessage, 'message')} className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-slate-200 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
                                                {copyMessageState ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                {copyMessageState ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-center text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-center gap-2">
                                            <Share2 className="h-4 w-4" />
                                            Quick Share
                                        </h3>
                                        <div className="flex justify-center items-center gap-3 sm:gap-4">
                                            {socialPlatforms.map((platform) => (
                                                <a key={platform.name} href={platform.url} onClick={platform.action} target="_blank" rel="noopener noreferrer"
                                                    className={`flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl text-white shadow-md transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95 ${platform.color}`}>
                                                    <platform.icon />
                                                    <span className="mt-1 text-[10px] font-bold">{platform.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    
                                     <div className="flex items-center space-x-2">
                                        <input
                                        type="text"
                                        readOnly
                                        value={fullUrl}
                                        className="flex-1 block w-full text-sm border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-800 rounded-lg p-3"
                                        />
                                        <button
                                        onClick={() => handleCopy(fullUrl, 'link')}
                                        className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            {copyLinkState ? <Check size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>


                                </div>

                                <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                    <button type="button" onClick={handleClose} className="w-full px-6 py-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 font-bold rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
                                        Done
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default StoreLinkModal;
