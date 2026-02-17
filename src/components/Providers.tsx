
'use client';

import { SpotlightProvider, useSpotlightContext } from '@/context/SpotlightContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { VendorProvider } from '@/context/VendorContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AnimatePresence, motion } from 'framer-motion';

function SpotlightOverlay() {
  const { isTipsSpotlightActive, setIsTipsSpotlightActive } = useSpotlightContext();

  const handleOverlayClick = () => {
    setIsTipsSpotlightActive(false);
  };

  return (
    <AnimatePresence>
      {isTipsSpotlightActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={handleOverlayClick}
        />
      )}
    </AnimatePresence>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      <VendorProvider>
        <WishlistProvider>
          <SpotlightProvider>
            {children}
            <SpotlightOverlay />
          </SpotlightProvider>
        </WishlistProvider>
      </VendorProvider>
    </CustomerProvider>
  );
}
