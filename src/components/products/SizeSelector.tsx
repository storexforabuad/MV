'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SizeSelectorProps {
    sizes: string[];
    selectedSize: string | undefined;
    onSizeSelect: (size: string) => void;
    sizeCategory?: 'baby-clothes' | 'kids-shoes' | 'adult-shoes'; // Made optional
    disabledSizes?: string[]; // Added
    className?: string;
    highlight?: boolean;
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
    disabledSizes,
    className = '',
    highlight = false,
}) => {
    const helperText = sizeCategory ? SIZE_CATEGORY_HELPERS[sizeCategory] : 'Available sizes';

    return (
        <motion.div
            className={`space-y-3 ${className}`}
            animate={highlight ? {
                scale: [1, 1.02, 1],
                boxShadow: [
                    '0 0 0 0 rgba(34, 197, 94, 0)',
                    '0 0 0 8px rgba(34, 197, 94, 0.35)',
                    '0 0 0 0 rgba(34, 197, 94, 0)'
                ]
            } : {}}
            transition={{ duration: 0.6, repeat: 2, ease: 'easeInOut' }}
            style={{ borderRadius: '12px', padding: '12px', margin: '-12px' }}
        >
            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{helperText}</p>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    const isDisabled = disabledSizes?.includes(size);

                    return (
                        <motion.button
                            key={size}
                            onClick={() => onSizeSelect(size)}
                            disabled={isDisabled}
                            whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                            className={`
                                relative px-3 py-2.5 rounded-lg font-semibold text-sm
                                transition-all duration-200 border-2
                                ${isSelected
                                    ? 'bg-green-600 border-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
                                }
                                ${!isDisabled
                                    ? 'hover:border-green-400 dark:hover:border-green-500'
                                    : ''
                                }
                                ${isDisabled
                                    ? 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed line-through'
                                    : ''
                                }
                            `}
                        >
                            {size}
                            {isSelected && !isDisabled && (
                                <motion.div
                                    layoutId="size-selector-active"
                                    className="absolute inset-0 rounded-lg bg-green-600 -z-10"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default SizeSelector;

