'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

type Category = {
  id: string;
  name: string;
  icon?: string;
};

interface CategoryBarProps {
  onCategorySelect: (categoryId: string) => void;
  activeCategoryId: string;
  categories: Category[];
  onActiveCategoryClick?: () => void;
  scrollDirection?: 'up' | 'down';
  storeType?: string | null;
}

export default function CategoryBar({ onCategorySelect, activeCategoryId, categories, onActiveCategoryClick, scrollDirection = 'up', storeType }: CategoryBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const scrollToCategory = (categoryId: string) => {
    const button = buttonRefs.current.get(categoryId);
    const container = containerRef.current;

    if (button && container) {
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (activeCategoryId && categories.length > 0) {
      // Try multiple times to ensure buttons are rendered and measured
      const attempts = [50, 200, 500, 1000];
      attempts.forEach(delay => {
        setTimeout(() => scrollToCategory(activeCategoryId), delay);
      });
    }
  }, [activeCategoryId, categories.length]);

  const handleCategoryClick = (categoryId: string) => {
    scrollToCategory(categoryId);

    if (activeCategoryId === categoryId) {
      if (onActiveCategoryClick) onActiveCategoryClick();
    } else {
      onCategorySelect(categoryId);
    }
  };

  const getIconForCategory = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'Promo': '🔥',
      'Popular': '💖',
      'New Arrivals': '⭐',
    };
    return iconMap[categoryName] || '🛍️';
  };

  const getCategoryColor = (categoryName: string): string | null => {
    const colorMap: { [key: string]: string } = {
      'Promo': 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]',
      'Popular': 'bg-[var(--badge-pink-bg)] text-[var(--badge-pink-text)]',
      'New Arrivals': 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
    };
    return colorMap[categoryName] || null;
  };

  const CategoryButton = ({ category, onClick, isActive }: {
    category: Category;
    onClick: () => void;
    isActive: boolean;
  }) => {
    const specialColorStyle = getCategoryColor(category.name);

    const iconContainerStyle = isActive && specialColorStyle
      ? specialColorStyle
      : 'bg-[var(--button-secondary)]';

    const iconTextStyle = isActive && specialColorStyle ? '' : 'text-text-primary';

    const labelTextStyle = isActive ? 'text-text-primary' : 'text-text-secondary';

    return (
      <motion.button
        ref={(el) => {
          if (el) buttonRefs.current.set(category.id, el);
          else buttonRefs.current.delete(category.id);
        }}
        onClick={onClick}
        className="flex flex-col items-center w-[72px] sm:w-[80px] flex-shrink-0"
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <motion.div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-1 sm:mb-2
            ${iconContainerStyle}
            ${isActive
              ? 'ring-[4px] ring-[var(--button-primary)] ring-offset-2 ring-offset-[var(--background)] shadow-[var(--shadow-lg)]'
              : 'hover:ring-3 hover:ring-[var(--button-primary)] hover:ring-offset-1 hover:ring-offset-[var(--background)]'
            }
            transform transition-all duration-200 ease-out`}
          animate={isActive ? { scale: [1, 1.1, 1.05] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
        >
          <span className={`text-2xl sm:text-2xl ${iconTextStyle}`}>{getIconForCategory(category.name)}</span>
        </motion.div>
        <motion.span
          className={`text-xs font-medium truncate max-w-[80px] text-center ${labelTextStyle}`}
          animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {category.name}
        </motion.span>
      </motion.button>
    );
  }

  const systemCategoriesAll: Category[] = [
    { id: 'promo', name: 'Promo' },
    { id: 'popular', name: 'Popular' },
    { id: 'new-arrivals', name: 'New Arrivals' },
  ];

  const systemCategories = storeType === 'restaurant'
    ? systemCategoriesAll.filter(c => c.name !== 'New Arrivals')
    : systemCategoriesAll;

  const vendorCategories = categories.filter(c => !systemCategories.some(sc => sc.name === c.name));
  return (
    <div
      className="category-bar-container glassmorphic is-sticky"
      style={{ top: scrollDirection === 'up' ? 'var(--navbar-height)' : '0' }}
    >
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide px-4 relative"
      >
        <div className="flex gap-3 py-3 min-w-min justify-center items-center">
          {systemCategories.map(category => (
            <CategoryButton
              key={category.id}
              category={category}
              onClick={() => handleCategoryClick(category.id)}
              isActive={activeCategoryId === category.id}
            />
          ))}

          {vendorCategories.length > 0 && (
            <div className="w-px h-10 bg-[var(--border-color)] opacity-60 mx-2" />
          )}

          {vendorCategories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              onClick={() => handleCategoryClick(category.id)}
              isActive={activeCategoryId === category.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
