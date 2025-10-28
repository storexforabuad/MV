'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import {
  getProducts,
  getCategories,
  getContacts,
  WholesaleData,
  getStoreMeta,
  updateProduct,
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  fetchStoreOrders,
  StoreOrder
} from '../../../lib/db';
import { Product } from '../../../types/product';
import { Category } from '../../../types/category';
import { StoreMeta } from '../../../types/store';
import AdminHeader from '../../../components/admin/AdminHeader';
import AdminSkeleton from '../../../components/admin/AdminSkeleton';
import MobileNav from '../../../components/admin/MobileNav';
import FloatingActionButton from '../../../components/admin/FloatingActionButton';
import AdminHomeCards from '../../../components/admin/AdminHomeCards';
import AddProductComposer from '../../../components/admin/AddProductComposer';
import ManageProductsModal from '../../../components/admin/ManageProductsModal';
import ManageCategoriesModal from '../../../components/admin/ManageCategoriesModal';
import { AdminOrdersModal } from '../../../components/admin/modals/AdminOrdersModal';
import dynamic from 'next/dynamic';
import PreviewSkeleton from '../../../components/admin/PreviewSkeleton';
import { markOnboardingAsCompleted } from '../../../app/actions/onboardingActions';
import { useSpotlightContext } from '@/context/SpotlightContext';
import { calculateStoreCommissions } from '../../../app/actions/orderActions';

const OnboardingFlow = dynamic(() => import('../../../components/admin/onboarding/OnboardingFlow'));

interface Referral {
  id: string;
  businessName: string;
  businessNumber: string;
}

// A new hook to fetch store orders
const useStoreOrders = (storeId: string) => {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const fetchedOrders = await fetchStoreOrders(storeId);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch store orders:", error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refreshOrders: fetchOrders };
};

async function getReferrals(storeId: string): Promise<Referral[]> {
    if (!storeId) return [];
    try {
      const response = await fetch(`/api/stores/${storeId}/referrals`);
      if (!response.ok) {
        console.error("Failed to fetch referrals");
        return [];
      }
      return response.json();
    } catch (error) {
      console.error("Error in getReferrals:", error);
      return [];
    }
}

export default function AdminStorePage() {
  const params = useParams();
  const storeId = typeof params?.storeId === 'string' ? params.storeId : Array.isArray(params?.storeId) ? params.storeId[0] : '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<WholesaleData[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [uiVisible, setUiVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { spotlightStep, setSpotlightStep } = useSpotlightContext();
  const [shouldShowSpotlight, setShouldShowSpotlight] = useState(false);
  const [commissionData, setCommissionData] = useState({ totalCommissionEarned: 0, totalReferralBonus: 0 });

  const { orders, refreshOrders } = useStoreOrders(storeId);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [fetchedProducts, fetchedCategories, fetchedContacts, fetchedStoreMeta, fetchedReferrals, fetchedCommissionData] = await Promise.all([
        getProducts(storeId),
        getCategories(storeId),
        getContacts(storeId),
        getStoreMeta(storeId),
        getReferrals(storeId),
        calculateStoreCommissions(storeId)
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setContacts(fetchedContacts);
      setStoreMeta(fetchedStoreMeta as StoreMeta);
      setReferrals(fetchedReferrals);
      setCommissionData(fetchedCommissionData);
      refreshOrders(); // Refresh orders as well

      const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true';
      if (fetchedStoreMeta?.hasCompletedOnboarding || hasCompletedOnboarding) {
        setShowOnboarding(false);
        setUiVisible(true);
      } else {
        setShowOnboarding(true);
        setUiVisible(false);
      }

    } catch {
      // handle error
    } finally {
      if (showRefresh) setIsRefreshing(false);
      setLoading(false);
    }
  }, [storeId, refreshOrders]);

  useEffect(() => {
    if (!storeId) return;
    fetchData();
  }, [storeId, fetchData]);

  const handleUpdateProduct = async (productId: string, updatedData: Partial<Product>) => {
      try {
          await updateProduct(storeId, productId, updatedData);
          await fetchData();
      } catch (error) {
          console.error("Failed to update product:", error);
          throw error; // Re-throw the error to be caught by the caller
      }
  };

  const handleDeleteProduct = async (productId: string) => {
      try {
          await deleteProduct(storeId, productId);
          fetchData();
      } catch (error) {
          console.error("Failed to delete product:", error);
      }
  };

  const handleAddCategory = async (name: string) => {
    try {
        await addCategory(storeId, name);
        fetchData();
    } catch (error) {
        console.error("Failed to add category:", error);
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
      try {
          await updateCategory(storeId, categoryId, name);
          fetchData();
      } catch (error) {
          console.error("Failed to update category:", error);
      }
  };

  const handleDeleteCategory = async (categoryId: string) => {
      try {
          await deleteCategory(storeId, categoryId);
          fetchData();
      } catch (error) {
          console.error("Failed to delete category:", error);
      }
  };

  useEffect(() => {
    if (activeSection === 'preview') {
      setIsPreviewLoading(true);
    }
  }, [activeSection]);

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    setIsTransitioning(true);
    setShouldShowSpotlight(true);
    markOnboardingAsCompleted(storeId);
    localStorage.setItem('hasCompletedOnboarding', 'true');

    setTimeout(() => {
      setIsTransitioning(false);
      setUiVisible(true);
    }, 800);
  }

  const handleAnimationComplete = () => {
    if (shouldShowSpotlight) {
      setTimeout(() => {
        setSpotlightStep('tips');
      }, 500);
      setShouldShowSpotlight(false);
    }
  };

  const totalRevenue = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  if (loading || showOnboarding === null) return <AdminSkeleton screen="home" />;

  if (isTransitioning) {
    return <AdminSkeleton screen="home" />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} storeName={storeMeta?.name || ''} />;
  }

  const isModalOpen = isComposerOpen || isManageModalOpen || isManageCategoriesModalOpen || isOrdersModalOpen;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 transition-colors">
      {!isModalOpen && <AdminHeader onLogout={async () => {}} isRefreshing={false} />}
      
      {activeSection !== 'preview' ? (
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <Suspense fallback={<AdminSkeleton isNavigation={true} />}>
            {activeSection === 'home' && (
              <div className={`mb-8 transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
                <AdminHomeCards
                  products={products}
                  categories={categories}
                  contacts={contacts}
                  setActiveSection={setActiveSection}
                  storeLink={`/${storeId}`}
                  onRefresh={() => fetchData(true)}
                  isRefreshing={isRefreshing}
                  totalProducts={products.length}
                  totalCategories={categories.length}
                  popularProducts={products.filter(p => p.views && p.views > 10).length}
                  limitedStock={products.filter(p => p.limitedStock).length}
                  totalViews={products.reduce((sum, p) => sum + (p.views || 0), 0)}
                  debtors={0}
                  subscriptionStatus={"Active"}
                  referrals={referrals.length}
                  onReferralAdded={() => fetchData(true)}
                  soldOut={products.filter(p => (typeof p.inStock === 'number' && p.inStock === 0) || p.soldOut === true).length}
                  totalContacts={contacts.reduce((sum, region) => sum + (region.contacts?.length || 0), 0)}
                  storeId={storeId}
                  totalOrders={orders.length} // Use live order count
                  promoCaption={storeMeta?.promoCaption}
                  uiVisible={uiVisible}
                  storeName={storeMeta?.name}
                  totalRevenue={totalRevenue}
                  onAnimationComplete={handleAnimationComplete}
                  onOrdersCardClick={() => setIsOrdersModalOpen(true)} // Wire up the click handler
                  openManageCategories={() => setIsManageCategoriesModalOpen(true)}
                  onProductsCardClick={() => setIsManageModalOpen(true)}
                  totalCommissionEarned={commissionData.totalCommissionEarned}
                  totalReferralBonus={commissionData.totalReferralBonus}
                />
              </div>
            )}
          </Suspense>
        </main>
      ) : (
        <div className="w-full h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
          {isPreviewLoading && <PreviewSkeleton />}
          <iframe
            src={`/${storeId}`}
            title="Store Preview"
            onLoad={() => setIsPreviewLoading(false)}
            className={`w-full h-full border-0 ${isPreviewLoading ? 'hidden' : 'block'}`}
          />
        </div>
      )}

      <AddProductComposer 
        isOpen={isComposerOpen} 
        onClose={() => setIsComposerOpen(false)} 
        storeId={storeId} 
        categories={categories} 
        onProductAdded={() => fetchData()} 
      />

      <ManageProductsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        products={products}
        setProducts={setProducts}
        categories={categories}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <ManageCategoriesModal
        isOpen={isManageCategoriesModalOpen}
        onClose={() => setIsManageCategoriesModalOpen(false)}
        products={products}
        categories={categories}
        storeId={storeId}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <AdminOrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        orders={orders}
      />

      <div className={`transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        {activeSection !== 'preview' && <FloatingActionButton isModalOpen={isModalOpen} />}
        { spotlightStep !== 'tips' && !isModalOpen && 
          <MobileNav 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
            onAddProductClick={() => setIsComposerOpen(true)} 
            onManageProductsClick={() => setIsManageModalOpen(true)}
            onManageCategoriesClick={() => setIsManageCategoriesModalOpen(true)}
          /> 
        }
      </div>
    </div>
  );
}
