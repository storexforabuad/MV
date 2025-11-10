
import { memo, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Info, Phone, MessageCircle, Star, Clock, X, MapPin } from 'lucide-react';
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

function BusinessCardModal({ open, onClose, storeMeta }: { open: boolean; onClose: () => void; storeMeta?: StoreMeta }) {
  
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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center h-64"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh]"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 z-10">
              <motion.button
                className="bg-gray-500/50 hover:bg-gray-600/60 rounded-full p-2"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>

            <div className="flex-grow overflow-y-auto">
              <div className="p-6 pt-8 text-center">
                
                {storeMeta.ceoImage && (
                  <Image
                    src={storeMeta.ceoImage}
                    alt={storeMeta.ceoName || 'CEO'}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white dark:border-slate-700 mx-auto mb-4"
                  />
                )}

                {storeMeta.businessDescription && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{storeMeta.businessDescription}</p>
                )}

                {storeMeta.ceoName && (
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{storeMeta.ceoName}</h2>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">CEO, {storeMeta.name}</p>

                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {/* <span className="text-xs text-slate-500 dark:text-slate-400">(4.8 stars from 476 reviews)</span> */}
                </div>
              </div>

              <div className="px-4 pb-6 space-y-3">
                {storeMeta.hasPhysicalShop && fullAddress && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{fullAddress}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-slate-300 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">Open 24/7</span>
                </div>

                {storeMeta.businessInstagram && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
                     <div className="w-5 h-5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">IG</span>
                      </div>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{storeMeta.businessInstagram}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="grid grid-cols-2 gap-3">
                <motion.a
                  href={`tel:${storeMeta.whatsapp?.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold py-3 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Call</span>
                </motion.a>

                <motion.a
                  href={`https://wa.me/${storeMeta.whatsapp?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text_white font-semibold py-3 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">WhatsApp</span>
                </motion.a>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
