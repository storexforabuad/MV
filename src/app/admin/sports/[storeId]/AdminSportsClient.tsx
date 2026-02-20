"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVendor } from '@/context/VendorContext';
import { verifyVendorByPhone } from '@/app/actions/vendorActions';
import AdminHomeCards from '@/components/admin/AdminHomeCards';
import AdminInvoicePanel from '@/components/admin/AdminInvoicePanel';

interface StoreMeta {
  id: string;
  storeType?: string;
  name?: string;
  whatsapp?: string;
  storePageViews?: number;
}

interface AdminSportsClientProps {
  storeId?: string;
  storeMeta?: StoreMeta;
}

export default function AdminSportsClient({ storeMeta, storeId: propStoreId }: AdminSportsClientProps) {
  const router = useRouter();
  const { vendor, loading: vendorLoading, promptLogin, setVendor } = useVendor();
  const [authorized, setAuthorized] = useState(false);
  const storeId = storeMeta?.id || propStoreId || '';

  useEffect(() => {
    // Temporarily disable vendor verification/redirect so vendors can access admin freely.
    // To re-enable: remove the if (false) guard and restore original verification logic.
    if (false) {
      (async () => {
        if (!storeId) return;
        if (vendorLoading) return; // still initializing vendor from storage

        if (!vendor) {
          try {
            promptLogin(storeId);
          } catch (e) {
            router.push(`/sports/${encodeURIComponent(storeId)}`);
          }
          return;
        }

        try {
          const res = await verifyVendorByPhone(storeId, vendor.phone);
          if (!res.success) {
            setVendor(null);
            router.push(`/sports/${encodeURIComponent(storeId)}`);
            return;
          }
          setAuthorized(true);
        } catch (err) {
          console.error('Error validating vendor on sports admin load', err);
          setVendor(null);
          router.push(`/sports/${encodeURIComponent(storeId)}`);
        }
      })();
    }
    setAuthorized(true);
  }, [storeId, vendor, vendorLoading]);

  if (vendorLoading || !authorized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">Loading admin…</div>
      </div>
    );
  }

  // Minimal admin home for sports vendors — leverages existing AdminHomeCards for pitch add, bookings modal, commission UI
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 transition-colors">
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <AdminHomeCards
          products={[]}
          categories={[]}
          contacts={[]}
          setActiveSection={() => { }}
          storeLink={`/sports/${storeId}`}
          onRefresh={() => { }}
          isRefreshing={false}
          totalProducts={0}
          totalCategories={0}
          totalViews={storeMeta?.storePageViews || 0}
          debtors={0}
          subscriptionStatus={'Active'}
          referrals={0}
          onReferralAdded={() => { }}
          totalContacts={0}
          storeId={storeId}
          storeType={storeMeta?.storeType}
          totalOrders={0}
          uiVisible={true}
          storeName={vendor?.name || ''}
          totalRevenue={0}
          onAnimationComplete={() => { }}
          onOrdersCardClick={() => { }}
          openManageCategories={() => { }}
          onProductsCardClick={() => { }}
          onAmbassadorCardClick={() => { }}
          totalCommission={0}
          totalReferralBonus={0}
          totalExpenses={0}
          deliveries={0}
        />
        {storeMeta?.storeType === 'sports' && (
          <div className="mt-6">
            <AdminInvoicePanel storeId={storeId} />
          </div>
        )}
      </main>
    </div>
  );
}
