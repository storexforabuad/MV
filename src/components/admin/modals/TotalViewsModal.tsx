import { Eye, Tag, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { Product } from '../../../types/product';
import Modal from '../../Modal';

interface TotalViewsModalProps {
  totalViews: number;
  products: Product[];
  setActiveSection: (section: string) => void;
  setManageTab?: (tab: 'all' | 'popular' | 'limited' | 'soldout') => void;
  setIsManageProductsOpen?: (open: boolean) => void;
  handleClose: () => void;
}

const TotalViewsModal: React.FC<TotalViewsModalProps> = ({
  totalViews,
  products,
  setActiveSection,
  setManageTab,
  setIsManageProductsOpen,
  handleClose,
}) => {
  const productsArr = Array.isArray(products) ? products : [];
  const isEmpty = productsArr.length === 0;

  const { topCategory, topViewedProduct } = (() => {
    if (isEmpty) return { topCategory: null, topViewedProduct: null };

    const categoryViews: Record<string, number> = {};
    productsArr.forEach(p => {
      const cat = p.category || 'Uncategorized';
      categoryViews[cat] = (categoryViews[cat] || 0) + (p.views || 0);
    });

    const sortedCats = Object.entries(categoryViews).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCats.length > 0 && sortedCats[0][1] > 0
      ? { name: sortedCats[0][0], views: sortedCats[0][1] }
      : null;

    const sortedByViews = [...productsArr].sort((a, b) => (b.views || 0) - (a.views || 0));
    const topViewedProduct = sortedByViews.length > 0 && (sortedByViews[0].views || 0) > 0 
      ? sortedByViews[0] 
      : null;

    return { topCategory, topViewedProduct };
  })();

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

  const getButtonText = () => {
    if (isEmpty) return 'Add First Product';
    return 'View All Products';
  };

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
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 mb-4 border border-success/20">
          <Eye className="w-7 h-7 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Total Views</h2>
        <p className="text-4xl font-bold text-success my-1">
          {totalViews}
        </p>
        <p className="text-sm text-text-secondary mb-6 text-center">Total product views across your store.</p>
        {/* Content */}
        <div className="w-full">
          {!topCategory && !topViewedProduct ? (
            <div className="w-full mt-2 flex flex-col items-center text-center">
              <p className="text-sm text-text-secondary mb-4">
                {isEmpty ? 'Your store is empty.' : 'No product views yet. Share your store link to get started!'}
              </p>
            </div>
          ) : (
            <div className="w-full space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {topCategory && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2 pl-1">Top Category</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-alt">
                    <Tag className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-text-primary truncate">{topCategory.name}</span>
                      <span className="text-xs text-text-secondary">{topCategory.views} Views</span>
                    </div>
                  </div>
                </div>
              )}
              {topViewedProduct && (
                 <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2 pl-1">Top Product</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-alt">
                    <div className="w-10 h-10 rounded-lg bg-background overflow-hidden flex items-center justify-center flex-shrink-0">
                      {topViewedProduct.images?.[0] ? (
                        <Image 
                          src={topViewedProduct.images[0]} 
                          alt={topViewedProduct.name} 
                          width={40} 
                          height={40} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-xs text-text-tertiary">No Img</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-text-primary truncate">{topViewedProduct.name}</span>
                      <span className="text-xs text-text-secondary">{topViewedProduct.views || 0} Views</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer Button */}
        <button
          className="mt-6 w-full px-4 py-2.5 rounded-lg bg-success text-success-foreground font-semibold hover:bg-success/90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={handlePrimaryAction}
        >
          {getButtonText()}
        </button>
      </div>
    </Modal>
  );
};

export default TotalViewsModal;
