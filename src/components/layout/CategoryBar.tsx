'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type Category = {
  id: string;
  name: string;
  icon?: string;
};

// ─── Helpers (stable, outside any component) ────────────────────────────────

const ICON_MAP: Record<string, string> = {
  'Promo': '🔥',
  'Popular': '💖',
  'New Arrivals': '⭐',
};

const COLOR_MAP: Record<string, string> = {
  'Promo': 'bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]',
  'Popular': 'bg-[var(--badge-pink-bg)] text-[var(--badge-pink-text)]',
  'New Arrivals': 'bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]',
};

function getIconForCategory(name: string) {
  return ICON_MAP[name] || '🛍️';
}

function getCategoryColor(name: string): string | null {
  return COLOR_MAP[name] || null;
}

// ─── CategoryButton — STABLE top-level component ─────────────────────────────
// Defined outside CategoryBar so its function reference never changes between
// CategoryBar re-renders. This prevents unnecessary unmount/remount cycles
// which were breaking the long-press timer.

interface CategoryButtonProps {
  category: Category;
  isActive: boolean;
  storeId: string;
  buttonRefSetter: (el: HTMLButtonElement | null, id: string) => void;
  onClick: () => void;
  onPressStart: (category: Category, isContextMenu?: boolean) => void;
  onPressEnd: () => void;
}

function CategoryButton({
  category,
  isActive,
  storeId,
  buttonRefSetter,
  onClick,
  onPressStart,
  onPressEnd,
}: CategoryButtonProps) {
  const specialColorStyle = getCategoryColor(category.name);
  const iconContainerStyle = isActive && specialColorStyle
    ? specialColorStyle
    : 'bg-[var(--button-secondary)]';
  const iconTextStyle = isActive && specialColorStyle ? '' : 'text-text-primary';
  const labelTextStyle = isActive ? 'text-text-primary' : 'text-text-secondary';

  return (
    <motion.button
      ref={(el) => buttonRefSetter(el, category.id)}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onPressStart(category, true);
      }}
      onTouchStart={(e) => {
        // Store initial touch coordinates to calculate slop
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          (e.currentTarget as any)._touchStartX = touch.clientX;
          (e.currentTarget as any)._touchStartY = touch.clientY;
        }
        onPressStart(category);
      }}
      onTouchEnd={onPressEnd}
      onTouchCancel={onPressEnd}
      onTouchMove={(e) => {
        // Implement slop: if finger moves more than 10px, cancel the press
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          const startX = (e.currentTarget as any)._touchStartX;
          const startY = (e.currentTarget as any)._touchStartY;

          if (startX !== undefined && startY !== undefined) {
            const dx = Math.abs(touch.clientX - startX);
            const dy = Math.abs(touch.clientY - startY);
            if (dx > 10 || dy > 10) {
              onPressEnd();
            }
          }
        }
      }}
      style={{ touchAction: 'pan-y', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' }}
      className="flex flex-col items-center w-[72px] sm:w-[80px] flex-shrink-0"
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
      >
        <span className={`text-2xl ${iconTextStyle}`}>{getIconForCategory(category.name)}</span>
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

// ─── CategoryBar ─────────────────────────────────────────────────────────────

interface CategoryBarProps {
  onCategorySelect: (categoryId: string) => void;
  activeCategoryId: string;
  categories: Category[];
  onActiveCategoryClick?: () => void;
  scrollDirection?: 'up' | 'down';
  storeType?: string | null;
  storeId?: string;
}

export default function CategoryBar({
  onCategorySelect,
  activeCategoryId,
  categories,
  onActiveCategoryClick,
  scrollDirection = 'up',
  storeType,
  storeId = 'bizcon',
}: CategoryBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // ── Long-press state lives HERE (stable component, never remounts) ──────────
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isCopyingRef = useRef(false);

  const executeCopy = (category: Category) => {
    // Prevent double firing if contextMenu and touch timer both resolve
    if (isCopyingRef.current) return;
    isCopyingRef.current = true;
    setTimeout(() => { isCopyingRef.current = false; }, 2000);

    const url = `https://tinyurl.com/bizconnet/${storeId}?category=${category.id}`;

    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success(`Link for ${category.name} copied!`, {
          duration: 2000,
          position: 'bottom-center',
          style: {
            background: 'var(--card-background)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
        });
        if (navigator.vibrate) navigator.vibrate(50);
      })
      .catch(() => toast.error('Failed to copy link'));
  };

  const handlePressStart = (category: Category, isContextMenu = false) => {
    // Clear any lingering timer before starting a new one
    if (pressTimer.current) clearTimeout(pressTimer.current);

    if (isContextMenu) {
      executeCopy(category);
      return;
    }

    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      executeCopy(category);
    }, 600);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // ── Button ref setter (stable callback) ────────────────────────────────────
  const buttonRefSetter = (el: HTMLButtonElement | null, id: string) => {
    if (el) buttonRefs.current.set(id, el);
    else buttonRefs.current.delete(id);
  };

  // ── Scroll active category into view ───────────────────────────────────────
  const scrollToCategory = (categoryId: string) => {
    const button = buttonRefs.current.get(categoryId);
    const container = containerRef.current;
    if (button && container) {
      const scrollLeft =
        button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (activeCategoryId && categories.length > 0) {
      [50, 200, 500, 1000].forEach(delay =>
        setTimeout(() => scrollToCategory(activeCategoryId), delay)
      );
    }
  }, [activeCategoryId, categories.length]);

  const handleCategoryClick = (categoryId: string) => {
    scrollToCategory(categoryId);
    if (activeCategoryId === categoryId) {
      onActiveCategoryClick?.();
    } else {
      onCategorySelect(categoryId);
    }
  };

  // ── Category lists ─────────────────────────────────────────────────────────
  const systemCategoriesAll: Category[] = [
    { id: 'promo', name: 'Promo' },
    { id: 'popular', name: 'Popular' },
    { id: 'new-arrivals', name: 'New Arrivals' },
  ];

  const systemCategories = storeType === 'restaurant'
    ? systemCategoriesAll.filter(c => c.name !== 'New Arrivals')
    : systemCategoriesAll;

  const vendorCategories = categories.filter(
    c => !systemCategories.some(sc => sc.name === c.name)
  );

  return (
    <div
      className="category-bar-container glassmorphic is-sticky"
      style={{ top: scrollDirection === 'up' ? 'var(--navbar-height)' : '0' }}
    >
      <div ref={containerRef} className="overflow-x-auto scrollbar-hide px-4 relative">
        <div className="flex gap-3 py-3 min-w-min justify-center items-center">
          {systemCategories.map(category => (
            <CategoryButton
              key={category.id}
              category={category}
              isActive={activeCategoryId === category.id}
              storeId={storeId}
              buttonRefSetter={buttonRefSetter}
              onClick={() => handleCategoryClick(category.id)}
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
            />
          ))}

          {vendorCategories.length > 0 && (
            <div className="w-px h-10 bg-[var(--border-color)] opacity-60 mx-2" />
          )}

          {vendorCategories.map(category => (
            <CategoryButton
              key={category.id}
              category={category}
              isActive={activeCategoryId === category.id}
              storeId={storeId}
              buttonRefSetter={buttonRefSetter}
              onClick={() => handleCategoryClick(category.id)}
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
