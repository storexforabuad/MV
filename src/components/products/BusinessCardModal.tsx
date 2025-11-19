
import { memo, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Info, Phone, MessageCircle, Star, Clock, MapPin, Instagram } from 'lucide-react';
import { Product } from '../../types/product';
import { motion, LayoutGroup, AnimatePresence, Transition } from 'framer-motion';
import Image from 'next/image';
import { getStoreMeta } from '../../lib/db';
import { StoreMeta } from '../../types/store';
import { useCustomer } from '@/context/CustomerContext';
import { useOrders } from '@/hooks/useOrders';
import { OrdersModal } from '@/components/customer/modals/OrdersModal';


export function BusinessCardModal({ open, onClose, storeMeta }: { open: boolean; onClose: () => void; storeMeta?: StoreMeta }) {

  useEffect(() => {
    if (!open) return;

    const handlePopState = () => {
      onClose();
    };

    window.history.pushState({ modalOpen: true }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  if (!storeMeta) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
          >
            <motion.div
              className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl bg-background flex flex-col items-center justify-center h-64"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Business Info...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const fullAddress = [storeMeta.shopNumber, storeMeta.plazaBuildingName, storeMeta.streetAddress, storeMeta.state, storeMeta.country].filter(Boolean).join(', ');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-[var(--modal-background)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-grow overflow-y-auto px-6 pt-6 pb-4">
              <div className="text-center mb-6">
                {storeMeta.ceoImage && (
                  <Image
                    src={storeMeta.ceoImage}
                    alt={storeMeta.ceoName || 'CEO'}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-[var(--modal-background)] mx-auto mb-3"
                  />
                )}
                <h2 className="text-2xl font-bold text-text-primary card-text-gradient">{storeMeta.name}</h2>
                {storeMeta.ceoName && (
                  <p className="text-base text-text-secondary mt-1">Led by {storeMeta.ceoName}</p>
                )}
                {storeMeta.businessDescription && (
                  <p className="text-sm text-text-secondary mt-3 max-w-sm mx-auto">{storeMeta.businessDescription}</p>
                )}
                <div className="flex items-center justify-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {storeMeta.hasPhysicalShop && fullAddress && (
                  <div className="flex items-start gap-4 p-4 border border-border-color rounded-xl">
                    <MapPin className="w-5 h-5 text-text-secondary flex-shrink-0 mt-1" />
                    <span className="text-sm text-text-primary">{fullAddress}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 p-4 border border-border-color rounded-xl">
                  <Clock className="w-5 h-5 text-text-secondary flex-shrink-0" />
                  <span className="text-sm text-text-primary font-medium">Open 24/7</span>
                </div>
                {storeMeta.businessInstagram && (
                  <div className="flex items-center gap-4 p-4 border border-border-color rounded-xl">
                    <Instagram className="w-5 h-5 text-text-secondary flex-shrink-0" />
                    <span className="text-sm text-text-primary">{storeMeta.businessInstagram}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <motion.a
                  href={`tel:${storeMeta.whatsapp?.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary font-semibold py-3 rounded-xl"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Call</span>
                </motion.a>
                <motion.a
                  href={`https://wa.me/${storeMeta.whatsapp?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">WhatsApp</span>
                </motion.a>
              </div>
            </div>

            <div className="px-6 pb-5 pt-3 bg-[var(--modal-background)] border-t border-border-color">

              <button onClick={onClose} className="w-full bg-slate-200 dark:bg-slate-800 text-text-primary font-semibold py-3 px-4 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors duration-200">
                close
              </button>
              <div className="text-center text-xs text-text-secondary mt-3">
                <style jsx>{`
                        .ai-text-gradient {
                            background: linear-gradient(90deg, #fde047, #22d3ee, #a855f7, #ec4899, #4ade80, #f97316, #fde047);
                            background-size: 400% 100%;
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            color: transparent;
                            animation: ai-gradient-flow 10s linear infinite;
                        }
                        @keyframes ai-gradient-flow {
                            0% { background-position: 0% 50%; }
                            100% { background-position: 100% 50%; }
                        }
                      `}</style>
                in partnership with <strong className="ai-text-gradient">(Biz+Con)™ </strong>Network
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}