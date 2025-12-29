"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import Image from 'next/image';

interface FavouritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FavouritesModal({ isOpen, onClose }: FavouritesModalProps) {
  const mockFavourites = [
    { id: 1, name: 'Pitch Paradise', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop', rating: 4.8, price: 25000, location: 'Lekki' },
    { id: 2, name: 'Sports Hub Arena', image: 'https://images.unsplash.com/photo-1517849845537-1d51a20414de?w=400&h=300&fit=crop', rating: 4.6, price: 20000, location: 'Ikoyi' },
    { id: 3, name: 'Elite Grounds', image: 'https://images.unsplash.com/photo-1439242803672-18e0b754a3f5?w=400&h=300&fit=crop', rating: 4.9, price: 30000, location: 'V.I' },
    { id: 4, name: 'Victory Fields', image: 'https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=400&h=300&fit=crop', rating: 4.5, price: 18000, location: 'Surulere' },
  ];

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Favourites</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{mockFavourites.length} saved pitches</p>
            </div>
            <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Heart className="w-6 h-6 text-white fill-white" />
            </motion.div>
          </header>

          {/* Main Content */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 scrollbar-hide">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {mockFavourites.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all"
                >
                  {/* Image */}
                  <div className="relative h-40 sm:h-48 overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">{item.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{item.location}</p>

                    {/* Rating and Price */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.rating}</span>
                      </div>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">₦{item.price.toLocaleString()}/hr</p>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 rounded-lg text-sm transition-all"
                    >
                      Book Now
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </main>

          {/* Footer */}
          <footer className="relative mt-auto flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
