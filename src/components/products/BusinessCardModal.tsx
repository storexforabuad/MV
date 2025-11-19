
import { useEffect } from 'react';
import { Phone, MessageCircle, Star, Clock, MapPin, Instagram, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { StoreMeta } from '../../types/store';


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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-[var(--modal-background)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200/50 dark:border-slate-700/50 dark:shadow-[0_0_80px_rgba(0,0,0,0.5),0_0_1px_1px_rgba(255,255,255,0.05)]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button - X Icon */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-200/90 dark:bg-slate-700/90 backdrop-blur-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200 shadow-lg dark:shadow-[0_0_12px_rgba(255,255,255,0.1)]"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </motion.button>

            <div className="flex-grow overflow-y-auto px-6 pt-6 pb-6">
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
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 card-text-gradient">{storeMeta.name}</h2>
                {storeMeta.ceoName && (
                  <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Led by {storeMeta.ceoName}</p>
                )}
                {storeMeta.businessDescription && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-sm mx-auto">{storeMeta.businessDescription}</p>
                )}
                <div className="flex items-center justify-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {storeMeta.hasPhysicalShop && fullAddress && (
                  <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm dark:shadow-inner">
                    <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-1" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{fullAddress}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm dark:shadow-inner">
                  <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Open 24/7</span>
                </div>
                {storeMeta.businessInstagram && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm dark:shadow-inner">
                    <Instagram className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{storeMeta.businessInstagram}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <motion.a
                  href={`tel:${storeMeta.whatsapp?.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-3 rounded-xl border border-slate-200 dark:border-slate-600/50 shadow-sm"
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

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                <style jsx>{`
                  .ai-text-gradient {
                    background: linear-gradient(90deg, #fde047, #22d3ee, #a855f7, #ec4899, #4ade80, #f97316, #fde047);
                    background-size: 400% 100%;
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                    will-change: background-position;
                    -webkit-animation: ai-gradient-flow 10s linear infinite;
                    animation: ai-gradient-flow 10s linear infinite;
                  }
                  @-webkit-keyframes ai-gradient-flow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
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