"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import VendorLookupModal from '@/components/vendor/VendorLookupModal';
import { getStoreMeta } from '@/lib/db';
import { useRouter } from 'next/navigation';

interface Vendor {
  phone: string;
  storeId: string;
  name?: string;
  id?: string;
}

interface VendorContextType {
  vendor: Vendor | null;
  setVendor: (v: Vendor | null) => void;
  loading: boolean;
  promptLogin: (storeId?: string) => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const [vendor, setVendorState] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vendor');
      if (saved) setVendorState(JSON.parse(saved));
    } catch (err) {
      console.error('Failed to parse vendor from localStorage', err);
      localStorage.removeItem('vendor');
    }
    setLoading(false);
  }, []);

  const setVendor = (v: Vendor | null) => {
    setVendorState(v);
    if (v) {
      try { localStorage.setItem('vendor', JSON.stringify(v)); } catch (e) { console.error(e); }
    } else {
      try { localStorage.removeItem('vendor'); } catch (e) { console.error(e); }
    }
  };

  // Temporarily disable the vendor lookup/login modal so vendors can access admin freely.
  // Keep the function signature for API compatibility; revert to re-enable modal.
  const promptLogin = (storeId?: string) => {
    // no-op: intentionally not opening the login modal
    return;
  };

  const handleLoginSuccess = async (v: Vendor) => {
    setVendor(v);
    setIsLoginModalOpen(false);
    if (pendingStoreId) {
      try {
        const meta = await getStoreMeta(pendingStoreId);
        let target = `/admin/${encodeURIComponent(pendingStoreId)}`;
        if (meta && (meta.storeType === 'sports' || meta.storeType === 'pitchperfect' || meta.storeType === 'pitch')) {
          // route sports stores to /admin/sports/{storeId}
          target = `/admin/sports/${encodeURIComponent(pendingStoreId)}`;
        }
        setPendingStoreId(null);
        router.push(target);
      } catch (err) {
        setPendingStoreId(null);
        router.push(`/admin/${encodeURIComponent(pendingStoreId)}`);
      }
    }
  };

  return (
    <VendorContext.Provider value={{ vendor, setVendor, loading, promptLogin }}>
      {children}
      <VendorLookupModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeId={pendingStoreId ?? undefined}
        onSuccess={handleLoginSuccess}
      />
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (context === undefined) throw new Error('useVendor must be used within a VendorProvider');
  return context;
};

