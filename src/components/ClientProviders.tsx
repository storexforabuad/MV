
'use client';

import dynamic from 'next/dynamic';
import { SpotlightProvider, useSpotlightContext } from '@/context/SpotlightContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { VendorProvider } from '@/context/VendorContext';
import { AnimatePresence, motion } from 'framer-motion';
import { usePWARedirect } from '@/hooks/usePWARedirect';

const InstallPrompt = dynamic(() => import('../components/InstallPrompt'), {
  ssr: false
});

const Toaster = dynamic(() => import('react-hot-toast').then(mod => mod.Toaster), {
  ssr: false
});

function SpotlightOverlay() {
  const { spotlightStep, setSpotlightStep } = useSpotlightContext();

  const handleOverlayClick = () => {
    setSpotlightStep('inactive');
  };

  return (
    <AnimatePresence>
      {spotlightStep !== 'inactive' && (
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

function PWARedirectHandler() {
  usePWARedirect();
  return null;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      <VendorProvider>
        <SpotlightProvider>
          <PWARedirectHandler />
          {children}
          <InstallPrompt />
          <Toaster 
            position="bottom-center"
            toastOptions={{
              className: 'toast',
              style: {
                background: 'var(--card-background)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              },
            }}
          />
          <SpotlightOverlay />
        </SpotlightProvider>
      </VendorProvider>
    </CustomerProvider>
  );
}
