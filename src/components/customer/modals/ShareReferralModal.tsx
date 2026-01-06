"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Copy, Share2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// It's good practice to have a dedicated component for icons.
// For this implementation, I'm assuming simple paths.
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>;
const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>;
const InstagramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z" /></svg>;
const SnapchatIcon = () => <div className="w-6 h-6 rounded-full bg-[#FFFC00] shadow-[0_0_12px_rgba(255,252,0,0.4)]" />;


interface ShareReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  referralLink: string;
}

const ShareReferralModal = ({ isOpen, onClose, storeName, referralLink }: ShareReferralModalProps) => {

  const shareActions = [
    {
      name: 'WhatsApp', icon: <WhatsAppIcon />, color: 'border-green-500/30 text-green-400 bg-green-500/5', action: () => {
        const message = encodeURIComponent(`Check out the ${storeName} online store! I think you'll love it. Use my link to shop: ${referralLink}`);
        window.open(`https://api.whatsapp.com/send?text=${message}`);
      }
    },
    {
      name: 'Facebook', icon: <FacebookIcon />, color: 'border-blue-500/30 text-blue-400 bg-blue-500/5', action: () => {
        const url = encodeURIComponent(referralLink);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
      }
    },
    {
      name: 'Instagram', icon: <InstagramIcon />, color: 'border-pink-500/30 text-pink-400 bg-pink-500/5', action: () => {
        navigator.clipboard.writeText(referralLink);
        toast.success('Link copied! Paste it in your Instagram story or bio.');
      }
    },
    {
      name: 'Snapchat', icon: <SnapchatIcon />, color: 'border-[#FFFC00]/30 text-[#FFFC00] bg-[#FFFC00]/5', action: () => {
        navigator.clipboard.writeText(referralLink);
        toast.success('Link copied! Paste it in your Snapchat story.');
      }
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center text-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform text-left transition bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] border-t sm:border border-white/10 overflow-hidden">
                {/* Background Glows */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-400/10 blur-[80px] rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full" />

                <div className="relative z-10 p-6 sm:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                      <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
                        <Sparkles className="text-amber-400" size={24} />
                      </div>
                      Share & Earn
                    </Dialog.Title>
                    <button onClick={onClose} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-90 flex items-center justify-center">
                      <X size={20} className="text-indigo-200" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-indigo-100/70 font-medium mb-8 leading-relaxed">
                    Share the <span className="text-white font-bold">{storeName}</span> online store with loved ones and earn referral bonuses, discounts, and gifts when they shop.
                  </p>

                  <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-8">
                    {shareActions.map(action => (
                      <button
                        key={action.name}
                        onClick={action.action}
                        className={`flex flex-col items-center justify-center p-3 rounded-[1.25rem] border transition-all hover:scale-105 active:scale-95 backdrop-blur-sm ${action.color}`}
                      >
                        <div className="mb-2">
                          {action.icon}
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{action.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative group mb-2">
                    <div className="absolute inset-0 bg-amber-400/5 blur-xl group-hover:bg-amber-400/10 transition-colors rounded-2xl" />
                    <div className="relative flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 pl-4">
                      <input
                        type="text"
                        readOnly
                        value={referralLink}
                        className="flex-1 bg-transparent text-sm text-indigo-100 font-medium focus:outline-none truncate"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-900/20"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ShareReferralModal;
