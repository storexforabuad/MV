'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { getCommissionAnalytics, CommissionEvent } from '@/app/actions/commissionActions';
import { getRevenueAnalytics, getReadyForDeliveryOrders } from '@/app/actions/orderActions'; // Import revenue and delivery analytics
import { requestNotificationPermission } from '../../../lib/firebase-messaging';
import { Product } from '../../../types/product';
import { isGeneralProduct } from '../../../utils/productHelpers';
import { Category } from '../../../types/category';
import { StoreMeta } from '../../../types/store';
import AdminHeader from '../../../components/admin/AdminHeader';
import AdminSkeleton from '../../../components/admin/AdminSkeleton';
import MobileNav from '../../../components/admin/MobileNav';
import FloatingActionButton from '../../../components/admin/FloatingActionButton';
import AdminHomeCards from '../../../components/admin/AdminHomeCards';
import dynamic from 'next/dynamic';
import PreviewSkeleton from '../../../components/admin/PreviewSkeleton';
import { markOnboardingAsCompleted } from '../../../app/actions/onboardingActions';
import { useSpotlightContext } from '@/context/SpotlightContext';

const OnboardingFlow = dynamic(() => import('../../../components/admin/onboarding/OnboardingFlow'), { ssr: false });
const AddProductComposer = dynamic(() => import('../../../components/admin/AddProductComposer'), { ssr: false });
const AddVehicleComposer = dynamic(() => import('../../../components/admin/AddVehicleComposer'), { ssr: false });
const AddLivestockComposer = dynamic(() => import('../../../components/admin/AddLivestockComposer'), { ssr: false });
const ManageProductsModal = dynamic(() => import('../../../components/admin/ManageProductsModal'), { ssr: false });
const ManageCategoriesModal = dynamic(() => import('../../../components/admin/ManageCategoriesModal'), { ssr: false });
const AdminOrdersModal = dynamic(() => import('../../../components/admin/modals/AdminOrdersModal').then(mod => mod.AdminOrdersModal), { ssr: false });
const AmbassadorHubModal = dynamic(() => import('../../../components/admin/modals/AmbassadorHubModal').then(mod => mod.AmbassadorHubModal), { ssr: false });
const PostsComposerModal = dynamic(() => import('../../../components/admin/modals/PostsComposerModal'), { ssr: false });

interface Referral {
  id: string;
  businessName: string;
  businessNumber: string;
}

interface CommissionAnalyticsData {
  totalCommission: number;
  commissionHistory: CommissionEvent[];
}

// A new hook to fetch store orders
// A new hook to fetch store orders
const useStoreOrders = (storeId: string, initialOrders: StoreOrder[]) => {
  const [orders, setOrders] = useState<StoreOrder[]>(initialOrders);
  const [loading, setLoading] = useState(false);

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

import { calculateCommissionAndBonus } from '../../../utils/calculations';

interface AdminStorePageClientProps {
  storeId: string;
  initialProducts: Product[];
  initialCategories: Category[];
  initialContacts: WholesaleData[];
  initialStoreMeta: StoreMeta | null;
  initialReferrals: Referral[];
  initialCommissionAnalytics: CommissionAnalyticsData;
  initialRevenueAnalytics: any;
  initialDeliveryOrders: StoreOrder[];
  initialOrders: StoreOrder[];
}

export default function AdminStorePageClient({
  storeId,
  initialProducts,
  initialCategories,
  initialContacts,
  initialStoreMeta,
  initialReferrals,
  initialCommissionAnalytics,
  initialRevenueAnalytics,
  initialDeliveryOrders,
  initialOrders
}: AdminStorePageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [contacts, setContacts] = useState<WholesaleData[]>(initialContacts);
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(initialStoreMeta);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);
  const [isAmbassadorHubModalOpen, setIsAmbassadorHubModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(
    initialStoreMeta?.hasCompletedOnboarding ? false : null
  );
  const [uiVisible, setUiVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { spotlightStep, setSpotlightStep } = useSpotlightContext();
  const [shouldShowSpotlight, setShouldShowSpotlight] = useState(false);
  const [commissionAnalytics, setCommissionAnalytics] = useState<CommissionAnalyticsData>(initialCommissionAnalytics);
  const [totalReferralBonus, setTotalReferralBonus] = useState(0);
  const [realTotalRevenue, setRealTotalRevenue] = useState(initialRevenueAnalytics ? initialRevenueAnalytics.lifetimeRevenue + initialRevenueAnalytics.lifetimeBonus : 0);
  const [deliveriesCount, setDeliveriesCount] = useState(initialDeliveryOrders.length);
  const [isHomeCardModalOpen, setIsHomeCardModalOpen] = useState(false);
  const [ambassadorTier, setAmbassadorTier] = useState<string>('bronze');
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const { orders, refreshOrders } = useStoreOrders(storeId, initialOrders);

  useEffect(() => {
    if (orders) {
      const { totalReferralBonus: calculatedBonus } = calculateCommissionAndBonus(orders);
      setTotalReferralBonus(calculatedBonus);
    }
  }, [orders]);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const [fetchedProducts, fetchedCategories, fetchedContacts, fetchedStoreMeta, fetchedReferrals, commissionData, revenueData, deliveryOrders] = await Promise.all([
        getProducts(storeId),
        getCategories(storeId),
        getContacts(storeId),
        getStoreMeta(storeId),
        getReferrals(storeId),
        getCommissionAnalytics(storeId),
        getRevenueAnalytics(storeId), // Fetch revenue data
        getReadyForDeliveryOrders(storeId) // Fetch delivery orders
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setContacts(fetchedContacts);
      setStoreMeta(fetchedStoreMeta as StoreMeta);
      setReferrals(fetchedReferrals);
      setCommissionAnalytics(commissionData);

      // Set real revenue (Revenue + Bonus)
      if (revenueData) {
        setRealTotalRevenue(revenueData.lifetimeRevenue + revenueData.lifetimeBonus);
      }

      // Set deliveries count
      if (deliveryOrders) {
        setDeliveriesCount(deliveryOrders.length);
      }

      // Fetch ambassadorTier from store document
      if (fetchedStoreMeta) {
        setAmbassadorTier((fetchedStoreMeta as any).ambassadorTier || 'bronze');
      }

      // TODO: You might want a similar analytics action for referral bonuses
      refreshOrders();

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
    // Only request notification permission on mount, data is already here!
    requestNotificationPermission(storeId);

    // Initialize ambassador tier from props
    if (initialStoreMeta) {
      setAmbassadorTier((initialStoreMeta as any).ambassadorTier || 'bronze');
    }

    // Initialize onboarding state
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true';
    if (initialStoreMeta?.hasCompletedOnboarding || hasCompletedOnboarding) {
      setShowOnboarding(false);
      setUiVisible(true);
    } else {
      setShowOnboarding(true);
      setUiVisible(false);
    }
  }, [storeId, initialStoreMeta]);

  useEffect(() => {
    if (searchParams && searchParams.get('open') === 'posts') {
      setIsPostsModalOpen(true);
    }
    if (searchParams && searchParams.get('open') === 'ambassador-hub') {
      setIsAmbassadorHubModalOpen(true);
    }
    // Handle order deep linking
    if (searchParams && searchParams.get('open') === 'orders') {
      const orderId = searchParams.get('orderId');
      if (orderId) {
        setHighlightOrderId(orderId);
      }
      setIsOrdersModalOpen(true);
    }
  }, [searchParams]);

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
      const newCategory = await addCategory(storeId, name);
      // Optimistically update the categories list immediately
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error("Failed to add category:", error);
      // If failed, re-fetch to ensure consistency
      fetchData();
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



  if (loading || showOnboarding === null) return <AdminSkeleton screen="home" />;

  if (isTransitioning) {
    return <AdminSkeleton screen="home" />;
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} storeName={storeMeta?.name || ''} />;
  }

  const isModalOpen = isComposerOpen || isManageModalOpen || isManageCategoriesModalOpen || isOrdersModalOpen || isPostsModalOpen || isAmbassadorHubModalOpen || isHomeCardModalOpen;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 transition-colors">
      {!isModalOpen && <AdminHeader onLogout={async () => { }} isRefreshing={false} />}

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
                  limitedStock={products.filter(p => isGeneralProduct(p) && p.limitedStock).length}
                  totalViews={products.reduce((sum, p) => sum + (p.views || 0), 0)}
                  debtors={0}
                  subscriptionStatus={"Active"}
                  referrals={referrals.length}
                  onReferralAdded={() => fetchData(true)}
                  soldOut={products.filter(p => isGeneralProduct(p) && (p as import('../../../types/product').GeneralProduct).soldOut === true).length}
                  totalContacts={contacts.reduce((sum, region) => sum + (region.contacts?.length || 0), 0)}
                  storeId={storeId}
                  totalOrders={orders.length} // Use live order count
                  promoCaption={storeMeta?.promoCaption}
                  uiVisible={uiVisible}
                  storeName={storeMeta?.name}
                  totalRevenue={realTotalRevenue} // Use the fetched real revenue
                  onAnimationComplete={handleAnimationComplete}
                  onOrdersCardClick={() => setIsOrdersModalOpen(true)}
                  openManageCategories={() => setIsManageCategoriesModalOpen(true)}
                  onProductsCardClick={() => setIsManageModalOpen(true)}
                  onAmbassadorCardClick={() => setIsAmbassadorHubModalOpen(true)}
                  totalCommission={commissionAnalytics.totalCommission} // Corrected prop!
                  totalReferralBonus={totalReferralBonus} // Using placeholder state
                  totalExpenses={0} // Placeholder, as in original code
                  deliveries={deliveriesCount} // Use the fetched deliveries count
                  setIsModalOpen={setIsHomeCardModalOpen}
                  ambassadorTier={ambassadorTier}
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

      {storeMeta?.storeType === 'automotive' ? (
        <AddVehicleComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory}
        />
      ) : storeMeta?.storeType === 'livestock' ? (
        <AddLivestockComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory}
        />
      ) : (
        <AddProductComposer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          storeId={storeId}
          categories={categories}
          onProductAdded={() => fetchData()}
          onAddCategory={handleAddCategory} // ADD THIS LINE
        />
      )}

      <ManageProductsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        products={products}
        setProducts={setProducts}
        categories={categories}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddCategory={handleAddCategory}
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
        onClose={() => {
          setIsOrdersModalOpen(false);
          setHighlightOrderId(null); // Clear highlight on close
        }}
        orders={orders}
        storeId={storeId}
        onOrderUpdated={refreshOrders}
        highlightOrderId={highlightOrderId}
      />

      <AmbassadorHubModal
        isOpen={isAmbassadorHubModalOpen}
        onClose={() => setIsAmbassadorHubModalOpen(false)}
        storeId={storeId}
        onReferralAdded={() => fetchData(true)}
      />

      <PostsComposerModal
        isOpen={isPostsModalOpen}
        onClose={() => setIsPostsModalOpen(false)}
        storeId={storeId}
        contacts={contacts}
        products={products}
        storeName={storeMeta?.name}
      />

      <div className={`transition-opacity duration-500 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
        {activeSection !== 'preview' && <FloatingActionButton isModalOpen={isModalOpen} />}
        {spotlightStep !== 'tips' && !isModalOpen &&
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
