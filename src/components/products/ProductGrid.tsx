
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

const ProductCard = dynamic(() => import('./ProductCard'), {
  loading: () => (
    <div className="animate-pulse bg-card-background rounded-2xl h-[280px]">
      <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  ),
  ssr: false
});

const BusinessCardModal = dynamic(() => import('./BusinessCardModal').then(mod => mod.BusinessCardModal), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl bg-background flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
                <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Business Info...</p>
            </div>
        </div>
    )
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
  }
  
  const ProductGrid = memo(function ProductGrid({ products, containerRef, storeId, activeCategoryId }: ProductGridProps) {
    const router = useRouter();
    const { customer, promptLogin } = useCustomer();
    const { orders, addOrder } = useOrders(customer?.id ?? null, storeId);
    const [isSingleColumn, setIsSingleColumn] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [isOrdersModalOpen, setOrdersModalOpen] = useState(false);
    const [storeMeta, setStoreMeta] = useState<StoreMeta | null>(null);
  
    useEffect(() => {
      async function fetchStoreMeta() {
        if (!storeId) return;
        const meta = await getStoreMeta(storeId);
        setStoreMeta(meta);
      }
      fetchStoreMeta();
    }, [storeId]);
  
    const handleOrdersClick = () => {
      if (customer) {
        setOrdersModalOpen(true);
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
              <GlassButton
                onClick={() => setIsSingleColumn(!isSingleColumn)}
                aria-label="Toggle grid layout"
                text={isSingleColumn ? 'Double' : 'Single'}
              />
              <GlassButton
                onClick={() => setAboutOpen(true)}
                aria-label="About this business"
              >
                <Info className="w-5 h-5 text-[var(--text-primary)]" />
              </GlassButton>
              <GlassButton
                onClick={handleOrdersClick}
                aria-label="Your Orders"
                text="Orders"
                badgeCount={orders.length}
              />
            </div>
          </div>
        )}
        
        {storeId && <BusinessCardModal open={aboutOpen} onClose={() => setAboutOpen(false)} storeMeta={storeMeta || undefined} />}
        {storeId && storeMeta && <OrdersModal isOpen={isOrdersModalOpen} onClose={() => setOrdersModalOpen(false)} orders={orders} storeId={storeId} addOrder={addOrder} storeMeta={storeMeta} />}
        
        <motion.div
          ref={containerRef}
          className={`mt-4 grid gap-3
            ${isSingleColumn ? 'grid-cols-1' : 'grid-cols-2'} 
            sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 
            px-3 sm:px-6 lg:px-8 bg-background`}
          layout
          transition={transition}
        >
          {sortedProducts.length === 0 ? (
            <div className="col-span-full w-full">
              <EmptyCategory />
            </div>
          ) : (
            sortedProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                transition={transition}
                className="group block relative touch-manipulation"
              >
                <ProductCard product={product} storeId={storeId} activeCategoryId={activeCategoryId} />
              </motion.div>
            ))
          )}
        </motion.div>
      </LayoutGroup>
    );
  });
  
  export default ProductGrid;
  