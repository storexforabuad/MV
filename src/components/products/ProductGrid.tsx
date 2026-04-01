
import { memo, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Info, Phone, MessageCircle, Star, Clock, MapPin, Instagram, Gift, Search, Globe, Sparkles, UserCircle } from 'lucide-react';
import { Product } from '../../types/product';
import { Order } from '../../hooks/useOrders';
import { motion, LayoutGroup, AnimatePresence, Transition } from 'framer-motion';
import Image from 'next/image';
import { getStoreMeta } from '../../lib/db';
import { StoreMeta } from '../../types/store';
import { useCustomer } from '@/context/CustomerContext';
import { useOrders } from '@/hooks/useOrders';
import CustomerProfileModal from '@/components/customer/modals/CustomerProfileModal';
import { ReferralsModal } from '@/components/customer/modals/ReferralsModal';
import {
  ensureProductType,
  isGeneralProduct,
  isFashionProduct,
  isVehicleProduct,
  isLivestockProduct,
  isFoodBeverageProduct,
} from '../../utils/productHelpers';
import OrderSummaryModal from '../modals/OrderSummaryModal';
import CartOrderSummaryModal from '../modals/CartOrderSummaryModal';
import SkeletonLoader from '../SkeletonLoader';
import { CartItem } from '@/lib/cartContext';
import SearchOverlay from '@/components/customer/modals/SearchOverlay';

const VehicleCard = dynamic(() => import('./VehicleCard'), {
  loading: () => <SkeletonLoader />,
  ssr: false
});

const ProductCard = dynamic(() => import('./ProductCard'), {
  loading: () => <SkeletonLoader />,
  ssr: false
});

function GlassButton({ onClick, children, 'aria-label': ariaLabel, text, badgeCount }: { onClick: () => void; children?: ReactNode; 'aria-label': string; text?: string; badgeCount?: number }) {
  const paddingClass = text ? 'px-4 py-3' : 'p-3';
  return (
    <motion.button
      className={`relative card-glass rounded-full flex items-center justify-center gap-2 shadow-lg ${paddingClass}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={ariaLabel}
    >
      {children}
      {text && <span className="text-sm font-medium text-[var(--text-primary)]">{text}</span>}
      {badgeCount !== undefined && (
        <div className={`absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ${badgeCount > 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
          {badgeCount}
        </div>
      )}
    </motion.button>
  );
}

const EmptyCategory = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] py-12 px-4 text-center select-none">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 180 }}
      className="mb-4"
    >
      <span className="block text-6xl sm:text-7xl mb-2 drop-shadow-lg">
        🛒
      </span>
    </motion.div>
    <h2 className="text-xl sm:text-2xl font-bold mb-2 card-text-gradient">
      All items sold out!
    </h2>
    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
      Please check back soon or explore other collections for amazing products!
    </p>
  </div>
);

interface ProductGridProps {
  products: Product[];
  containerRef?: React.Ref<HTMLDivElement>;
  storeId?: string;
  activeCategoryId: string;
  onAboutClick: () => void;
  storeMeta?: StoreMeta | null;
  isOrdersModalOpen: boolean;
  setOrdersModalOpen: (isOpen: boolean) => void;
  highlightOrderId?: string | null;
  onNotificationRequest?: () => Promise<{ success: boolean; error?: string }>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeDirection?: 'left' | 'right' | null;
  isSwipeTransitioning?: boolean;
  isLoading?: boolean;
  onCategoryChange?: (categoryId: string) => void;
  onNeedAWebsiteClick?: () => void;
}

const ProductGrid = memo(function ProductGrid({
  products,
  containerRef,
  storeId,
  activeCategoryId,
  onAboutClick,
  storeMeta,
  isOrdersModalOpen,
  setOrdersModalOpen,
  highlightOrderId,
  onNotificationRequest,
  onSwipeLeft,
  onSwipeRight,
  swipeDirection,
  isSwipeTransitioning,
  isLoading,
  onCategoryChange,
  onNeedAWebsiteClick
}: ProductGridProps) {
  const router = useRouter();
  const { customer, promptLogin } = useCustomer();
  const { orders, addOrder, refetchOrders } = useOrders(customer?.id ?? null, storeId || "");
  const [isSingleColumn, setIsSingleColumn] = useState(true);
  const [isReferralModalOpen, setReferralModalOpen] = useState(false);

  // Order modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalProduct, setOrderModalProduct] = useState<Product | null>(null);
  const [orderModalColor, setOrderModalColor] = useState<string | undefined>();
  const [orderModalSize, setOrderModalSize] = useState<string | undefined>();
  const [orderModalImage, setOrderModalImage] = useState<string | undefined>();
  const [orderModalQuantity, setOrderModalQuantity] = useState(1);

  // Reorder state
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderItems, setReorderItems] = useState<CartItem[]>([]);
  const [isReorder, setIsReorder] = useState(false);

  // Search state
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const handleReorder = (order: Order) => {
    const orderItems = order.products.map(p => ({
      ...p,
      quantity: p.productType === 'general' ? (p as any).quantity || 1 : 1,
      selectedColor: (p as any).selectedColor || (p as any).color,
      selectedSize: (p as any).selectedSize || (p as any).size,
      storeId: storeId || order.storeMeta.id
    })) as CartItem[];

    if (orderItems.length === 1) {
      // Use existing OrderSummaryModal for single item reorders
      setOrderModalProduct(orderItems[0] as any);
      setOrderModalColor(orderItems[0].selectedColor);
      setOrderModalSize(orderItems[0].selectedSize);
      setOrderModalQuantity(orderItems[0].quantity);
      setIsReorder(true);
      setIsOrderModalOpen(true);
    } else {
      // Use CartOrderSummaryModal for multi-item reorders
      setReorderItems(orderItems);
      setIsReorder(true);
      setIsReorderModalOpen(true);
    }
  };

  const handleOrderClick = (product: Product, selectedColor?: string, selectedSize?: string, selectedImage?: string) => {
    setOrderModalProduct(product);
    setOrderModalColor(selectedColor);
    setOrderModalSize(selectedSize);
    setOrderModalImage(selectedImage);
    setIsReorder(false);
    setIsOrderModalOpen(true);
  };


  const handleOrdersClick = () => {
    setOrdersModalOpen(true);
  };

  const handleReferralsClick = () => {
    if (customer) {
      setReferralModalOpen(true);
    } else {
      promptLogin();
    }
  };

  const validProducts = products.filter(p => p && p.id && Array.isArray(p.images));

  const sortedProducts = [...validProducts].sort((a, b) => {
    const timestampA = a.createdAt?.toMillis?.() || 0;
    const timestampB = b.createdAt?.toMillis?.() || 0;
    return timestampB - timestampA;
  });

  const transition: Transition = {
    type: "spring",
    stiffness: 280,
    damping: 25,
    mass: 0.5,
  };

  return (
    <LayoutGroup>
      {storeId && (
        <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Layout Toggle Hidden as per request */}
            {/* <GlassButton
              onClick={() => setIsSingleColumn(!isSingleColumn)}
              aria-label="Toggle grid layout"
              text={isSingleColumn ? 'Double' : 'Single'}
            /> */}
            <GlassButton
              onClick={onAboutClick}
              aria-label="About this business"
            >
              <Info className="w-5 h-5 text-[var(--text-primary)]" />
            </GlassButton>

            {storeMeta?.paymentFlow === 'paystack_escrow' ? (
              <GlassButton
                onClick={() => setOrdersModalOpen(true)}
                aria-label="Member Profile"
                text="Profile"
              />
            ) : (
              <GlassButton
                onClick={() => setOrdersModalOpen(true)}
                aria-label="Your Orders"
                text="Orders"
              />
            )}

            {/* <GlassButton
              onClick={() => setIsSearchOverlayOpen(true)}
              aria-label="Search products"
            >
              <Search className="w-5 h-5 text-[var(--text-primary)]" />
            </GlassButton> */}
          </div>
        </div>
      )}

      {storeId && storeMeta && (
        <CustomerProfileModal
          isOpen={isOrdersModalOpen}
          onClose={() => setOrdersModalOpen(false)}
          orders={orders}
          storeId={storeId}
          addOrder={addOrder}
          storeMeta={storeMeta}
          customer={customer}
          highlightOrderId={highlightOrderId}
          onNotificationRequest={onNotificationRequest}
          onReorder={handleReorder}
          onRefresh={refetchOrders}
          showOnlyOrders={storeMeta?.paymentFlow !== 'paystack_escrow'}
        />
      )}
      {storeId && (
        <SearchOverlay
          isOpen={isSearchOverlayOpen}
          onClose={() => setIsSearchOverlayOpen(false)}
          products={products}
          storeId={storeId || undefined}
          onProductClick={(product) => {
            setIsSearchOverlayOpen(false);
            const targetUrl = storeId
              ? `/${storeId}/products/${product.id}`
              : `/compass/products/${product.id}?storeId=${product.storeId}`;

            // Using window.location.href for the most robust navigation from a modal state
            // to ensure it doesn't get cancelled by the component unmounting.
            window.location.href = targetUrl;
          }}
        />
      )}
      {storeId && <ReferralsModal isOpen={isReferralModalOpen} onClose={() => setReferralModalOpen(false)} storeId={storeId} />}

      <motion.div
        ref={containerRef}
        animate={{
          x: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0,
          opacity: isSwipeTransitioning ? 0.7 : 1
        }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className={`mt-4 grid gap-3
            ${isSingleColumn ? 'grid-cols-1' : 'grid-cols-2'} 
            sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 
            px-3 sm:px-6 lg:px-8 bg-background`}
        layout
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              layout
              transition={transition}
            >
              <SkeletonLoader />
            </motion.div>
          ))
        ) : sortedProducts.length === 0 ? (
          <div className="col-span-full w-full">
            <EmptyCategory />
          </div>
        ) : (
          sortedProducts.map((product) => {
            const productWithType = ensureProductType(product);
            return (
              <motion.div
                key={product.id}
                layout
                transition={transition}
                className="group block relative touch-manipulation"
              >
                {productWithType.productType === 'vehicle' ? (
                  <VehicleCard
                    product={productWithType}
                    storeId={storeId}
                    onOrderClick={handleOrderClick}
                  />
                ) : (
                  <ProductCard
                    product={productWithType}
                    storeId={storeId}
                    activeCategoryId={activeCategoryId}
                    storeMeta={storeMeta}
                    onOrderClick={handleOrderClick}
                    isSingleView={isSingleColumn}
                  />
                )}
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Branded Footer */}
      {!isLoading && sortedProducts.length > 0 && onNeedAWebsiteClick && false && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 mb-28 flex justify-center px-4 relative"
        >
          {(() => {
            const is420Hub = storeMeta?.id === '420-Hub' || storeMeta?.name === '420-Hub' || storeMeta?.name === '420 Hub';
            const isStunnerStores = storeMeta?.id?.toLowerCase().includes('stunner') || storeMeta?.name?.toLowerCase().includes('stunner');
            return (
              <button
                onClick={onNeedAWebsiteClick}
                className={`w-full max-w-sm relative p-6 rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group border ${isStunnerStores ? 'bg-gradient-to-br from-zinc-950/90 via-black to-violet-950/80 border-violet-500/30' : is420Hub ? 'bg-gradient-to-br from-zinc-950/90 via-black to-emerald-950/80 border-emerald-500/30' : 'bg-gradient-to-br from-[#1a1a40] via-[#2d1b4d] to-[#1a1a40] border-amber-500/30'}`}
              >
                {/* Promo Badge */}
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-20 uppercase tracking-[0.2em] border ${isStunnerStores ? 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-violet-500/20 border-violet-400/20' : is420Hub ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 border-emerald-400/20' : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/20 border-amber-400/20'}`}>
                  PROMO
                </div>
                {/* Shimmer Layer */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent" />
                </div>

                {/* Subtle background glows */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full opacity-50 z-0 ${isStunnerStores ? 'bg-violet-500/10' : is420Hub ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`} />
                <div className={`absolute -bottom-10 -left-10 w-32 h-32 blur-[40px] rounded-full opacity-50 z-0 ${isStunnerStores ? 'bg-cyan-500/10' : is420Hub ? 'bg-emerald-600/10' : 'bg-purple-500/10'}`} />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${isStunnerStores ? 'bg-violet-500/10 border-violet-500/20' : is420Hub ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-amber-400/10 border-amber-400/20'}`}>
                      <Globe className={`w-4 h-4 ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </div>
                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isStunnerStores ? 'text-violet-400/80' : is420Hub ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
                      POWERED BY <span className={isStunnerStores ? 'text-violet-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}>COMPASS 🧭 2026.</span>
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1 text-center w-full">
                    <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Get your professional Website like
                    </p>
                    <p className="text-base sm:text-xl font-black text-white tracking-tight">
                      {storeMeta?.name || 'this'}
                    </p>
                    <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mt-2 group-hover:gap-3 transition-all ${isStunnerStores ? 'text-cyan-400' : is420Hub ? 'text-emerald-400' : 'text-amber-400'}`}>
                      Tap to start <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })()}
        </motion.div>
      )}

      <OrderSummaryModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={orderModalProduct}
        storeMeta={storeMeta ?? null}
        customer={null}
        selectedSize={orderModalSize}
        selectedColor={orderModalColor}
        selectedImage={orderModalImage}
        initialQuantity={orderModalQuantity}
        openedFrom="productCard"
        isReorder={isReorder}
      />

      {storeMeta && (
        <CartOrderSummaryModal
          isOpen={isReorderModalOpen}
          onClose={() => setIsReorderModalOpen(false)}
          onOrderSuccess={() => setIsReorderModalOpen(false)}
          cartItems={reorderItems}
          storeMeta={storeMeta}
          customer={customer}
          storeId={storeId}
          isReorder={isReorder}
        />
      )}
    </LayoutGroup>
  );
});

export default ProductGrid;
