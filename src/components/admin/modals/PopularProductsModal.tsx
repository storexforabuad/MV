import { Star, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { Product } from '../../../types/product';
import Modal from '../../Modal';

interface PopularProductsModalProps {
  popularProducts: number;
  products: Product[];
  setActiveSection: (section: string) => void;
  setManageTab?: (tab: 'all' | 'popular' | 'limited' | 'soldout') => void;
  setIsManageProductsOpen?: (open: boolean) => void;
  handleClose: () => void;
}

const PopularProductsModal: React.FC<PopularProductsModalProps> = ({
  popularProducts,
  products,
  setActiveSection,
  setManageTab,
  setIsManageProductsOpen,
  handleClose,
}) => {
  const productsArr = Array.isArray(products) ? products : [];
  const popularArr = productsArr.filter(p => p.views && p.views > 10);
  const isEmpty = productsArr.length === 0;
  const hasPopularItems = popularArr.length > 0;
  
  const sortedPopular = hasPopularItems
    ? [...popularArr].sort((a, b) => (b.views || 0) - (a.views || 0))
    : [];
  const topPopular = sortedPopular.slice(0, 5);

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

  const handlePrimaryAction = () => {
    if (isEmpty) {
      setActiveSection('add');
    } else {
      setActiveSection('manage');
      if (setManageTab) setManageTab('popular');
      if (setIsManageProductsOpen) setIsManageProductsOpen(true);
    }
    handleClose();
  };

  const getButtonText = () => {
    if (isEmpty) return 'Add First Product';
    if (!hasPopularItems) return 'Check Product Views';
    return 'View All Popular';
  };

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
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400/10 dark:bg-yellow-500/10 mb-4 border border-yellow-400/20 dark:border-yellow-500/20">
          <Star className="w-7 h-7 text-yellow-500 dark:text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Popular Products</h2>
        <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 my-1">{popularProducts}</p>
        <p className="text-sm text-text-secondary mb-6 text-center">Products with more than 10 views.</p>

        {/* Content */}
        <div className="w-full">
          {!hasPopularItems ? (
            <div className="w-full mt-2 flex flex-col items-center text-center">
              <p className="text-sm text-text-secondary mb-4 px-4">
                {isEmpty ? 'No products have been added yet.' : 'No products have reached popular status. Share your store to increase views!'}
              </p>
            </div>
          ) : (
            <div className="w-full max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-xs font-semibold text-text-secondary mb-2 pl-1">Top Viewed Items</p>
              <ul className="space-y-2">
                {topPopular.map((product) => (
                  <li 
                    key={product.id} 
                    className="flex items-center gap-3 p-2 rounded-lg bg-background-alt transition-colors border-b border-border-color last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-background overflow-hidden flex items-center justify-center flex-shrink-0">
                      {product.images?.[0] ? (
                        <Image 
                          src={product.images[0]} 
                          alt={product.name} 
                          width={40} 
                          height={40} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-xs text-text-tertiary">No Img</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-text-primary truncate">{product.name}</span>
                      <span className="text-xs text-text-secondary">Views: {product.views || 0}</span>
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
          {getButtonText()}
        </button>
      </div>
    </Modal>
  );
};

export default PopularProductsModal;
