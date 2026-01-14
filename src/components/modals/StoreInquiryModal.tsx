
"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';

interface StoreInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StoreInquiryModal = ({ isOpen, onClose }: StoreInquiryModalProps) => {
  const [businessName, setBusinessName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      toast.error('Please enter a business name.');
      return;
    }

    setIsSubmitting(true);

    const phoneNumber = "2348119772223";
    const message = encodeURIComponent(
      `Hello! I'm interested in getting an online store like the one I saw. My business name is: "${businessName}".`
    );

    const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(phoneNumber)}?text=${message}`;

    window.open(whatsappUrl, '_blank');

    toast.success("Redirecting to WhatsApp...");

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      setBusinessName('');
    }, 1000);
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
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm transition-opacity" />
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
              <Dialog.Panel className="relative w-full max-w-md transform text-left transition bg-slate-100 dark:bg-slate-900 shadow-2xl rounded-t-2xl sm:rounded-2xl">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Get Your Own Store
                    </Dialog.Title>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                      <X size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    For just <span className="font-bold text-indigo-600 dark:text-indigo-400">₦5,000</span>, you can get a beautiful online store just like this one to grow your business.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your Business Name"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-700 transition-colors disabled:bg-slate-500 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Redirecting...' : 'Send Inquiry'}
                      {!isSubmitting && <Send size={18} />}
                    </button>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default StoreInquiryModal;
