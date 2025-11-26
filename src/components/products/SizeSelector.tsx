'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SizeSelectorProps {
    sizes: string[];
    selectedSize: string | undefined;
    onSizeSelect: (size: string) => void;
    sizeCategory: 'baby-clothes' | 'kids-shoes' | 'adult-shoes';
    className?: string;
}

const SIZE_CATEGORY_LABELS: Record<string, string> = {
    'baby-clothes': 'Baby Clothes',
    'kids-shoes': 'Kids Shoes',
    'adult-shoes': 'Adult Shoes',
};

const SIZE_CATEGORY_HELPERS: Record<string, string> = {
    'baby-clothes': 'Select age range',
    'kids-shoes': 'Select shoe size',
    'adult-shoes': 'Select shoe size',
};

export const SizeSelector: React.FC<SizeSelectorProps> = ({
    sizes,
    selectedSize,
    onSizeSelect,
    sizeCategory,
    className = '',
}) => {
    const categoryLabel = SIZE_CATEGORY_LABELS[sizeCategory] || 'Select Size';
    const helperText = SIZE_CATEGORY_HELPERS[sizeCategory];

    return (
        <div className={`space-y-3 ${className}`}>
            <div>
                {/* Main heading removed as per user request */}
                <p className="text-sm font-medium text-text-secondary">{helperText}</p>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {sizes.map((size) => {
                    const isSelected = selectedSize === size;

                    return (
                        <motion.button
                            key={size}
                            onClick={() => onSizeSelect(size)}
                            whileTap={{ scale: 0.95 }}
                            className={`
                relative px-3 py-2.5 rounded-lg font-semibold text-sm
                transition-all duration-200 border-2
                ${isSelected
                                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/30'
                                    : 'bg-input-background border-input-border text-text-primary hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }
              `}
                        >
                            {size}
                            {isSelected && (
                                <motion.div
                                    layoutId="size-selector"
                                    className="absolute inset-0 bg-green-600 rounded-lg -z-10"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default SizeSelector;
