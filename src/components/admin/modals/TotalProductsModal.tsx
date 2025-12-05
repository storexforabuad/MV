import { Archive, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { Product } from '../../../types/product';
import Modal from '../../Modal';

interface TotalProductsModalProps {
  totalProducts: number;
  products: Product[];
  setActiveSection: (section: string) => void;
  setManageTab?: (tab: 'all' | 'popular' | 'limited' | 'soldout') => void;
  setIsManageProductsOpen?: (open: boolean) => void;
  handleClose: () => void;
}

const TotalProductsModal: React.FC<TotalProductsModalProps> = ({
  totalProducts,
  products,
  setActiveSection,
  setManageTab,
  setIsManageProductsOpen,
  handleClose,
}) => {
  const productsArr = Array.isArray(products) ? products : [];
  const isEmpty = productsArr.length === 0;

  const latestProducts = [...productsArr]
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (typeof a.createdAt === 'number' ? a.createdAt : 0);
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (typeof b.createdAt === 'number' ? b.createdAt : 0);
      return (bTime || 0) - (aTime || 0);
    })
    .slice(0, 5);

  const handlePrimaryAction = () => {
    if (isEmpty) {
      setActiveSection('add');
    } else {
      setActiveSection('manage');
      if (setManageTab) setManageTab('all');
      if (setIsManageProductsOpen) setIsManageProductsOpen(true);
    }
    handleClose();
  };

  // Handle back button (popstate) to close modal on mobile
  useEffect(() => {
    window.history.pushState({ modalOpen: true }, '');
    const handlePopState = () => {
      handleClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleClose]);

  return (
    <Modal open={true} onClose={handleClose}>
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-10 text-text-secondary hover:text-text-primary bg-white/80 dark:bg-slate-700/80 rounded-full p-1.5 shadow"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="w-full flex flex-col items-center">
        {/* Header */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-700/20 mb-4 border border-blue-500/20 dark:border-blue-700/30">
          <Archive className="w-7 h-7 text-blue-500 dark:text-blue-300" />
        </div>
        <h2 className="text-xl font-bold text-text-primary dark:text-white">Total Products</h2>
        <p className="text-4xl font-bold text-blue-500 dark:text-blue-300 my-1">
          {totalProducts}
        </p>
        <p className="text-sm text-text-secondary dark:text-slate-300 mb-6">All products currently in your store.</p>
        {/* Content */}
        <div className="w-full">
          {isEmpty ? (
            <div className="w-full mt-2 flex flex-col items-center text-center">
              <p className="text-sm text-text-secondary dark:text-slate-400 mb-4">No products have been added yet.</p>
              <p className="text-xs text-text-tertiary dark:text-slate-500 mb-4">Get started by adding your first product.</p>
            </div>
          ) : (
            <div className="w-full max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-xs font-semibold text-text-secondary dark:text-slate-400 mb-2 pl-1">Latest Additions</p>
              <ul className="space-y-2">
                {latestProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-background-alt dark:bg-slate-700/40 transition-colors border-b border-border-color dark:border-slate-700 last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-background dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-text-tertiary dark:text-slate-500">No Img</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-text-primary dark:text-white truncate">{product.name}</span>
                      <span className="text-xs text-text-secondary dark:text-slate-400">{'category' in product && product.category ? product.category : 'Uncategorized'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* Footer Button */}
        <button
          className="mt-6 w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={handlePrimaryAction}
        >
          {isEmpty ? 'Add First Product' : 'View All Products'}
        </button>
      </div>
    </Modal>
  );
};

export default TotalProductsModal;
