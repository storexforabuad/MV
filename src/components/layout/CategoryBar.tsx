'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

export default function CategoryBar({ onCategorySelect, activeCategoryId, categories, onActiveCategoryClick }: CategoryBarProps) {
  const [isSticky, setIsSticky] = useState(false);

  const handleScroll = useCallback(() => {
    const navbar = document.querySelector('nav');
    const navHeight = navbar?.getBoundingClientRect().height || 64;
    const offset = window.pageYOffset || document.documentElement.scrollTop;
    setIsSticky(offset > navHeight / 2);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleCategoryClick = (categoryId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const container = button.parentElement?.parentElement;
    if (container) {
      const containerWidth = container.offsetWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }

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

  // This function now only returns styles for *special* system categories.
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
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; 
    isActive: boolean;
  }) => {
    const specialColorStyle = getCategoryColor(category.name);

    // If active, use the special color. If not, use the theme's secondary button style.
    // If inactive, also use the theme's secondary button style for a consistent, high-contrast look.
    const iconContainerStyle = isActive && specialColorStyle
      ? specialColorStyle
      : 'bg-[var(--button-secondary)]';
      
    // The text on the icon needs to be readable. Special styles have their own text color.
    // For our default style, we need to ensure the text is bright.
    const iconTextStyle = isActive && specialColorStyle ? '' : 'text-text-primary';

    // The label below the icon is bright when active, and dimmer when inactive.
    const labelTextStyle = isActive ? 'text-text-primary' : 'text-text-secondary';

    return (
      <motion.button
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

  // Define system categories that appear first
  const systemCategories: Category[] = [
    { id: 'promo', name: 'Promo' },
    { id: 'popular', name: 'Popular' },
    { id: 'new-arrivals', name: 'New Arrivals' },
  ];

  // Filter out any vendor-created categories that have the same name as system ones
  const vendorCategories = categories.filter(c => !systemCategories.some(sc => sc.name === c.name));

  return (
    <div className={`category-bar-container card-glass ${isSticky ? 'is-sticky' : ''} relative`}>
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-3 py-3 min-w-min justify-center items-center">
          {/* System Categories */}
          {systemCategories.map(category => (
            <CategoryButton 
              key={category.id}
              category={category}
              onClick={(e) => handleCategoryClick(category.id, e)} 
              isActive={activeCategoryId === category.id}
            />
          ))}

          {/* Separator */}
          {vendorCategories.length > 0 && (
            <div className="w-px h-10 bg-[var(--border-color)] opacity-60 mx-2" />
          )}

          {/* Vendor-generated categories */}
          {vendorCategories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              onClick={(e) => handleCategoryClick(category.id, e)}
              isActive={activeCategoryId === category.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
