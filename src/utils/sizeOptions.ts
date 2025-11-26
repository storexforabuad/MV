/**
 * Utility functions for product size options
 */

export type SizeOption = 'baby-clothes' | 'kids-shoes' | 'adult-shoes';

export const SIZE_OPTIONS: Record<SizeOption, string[]> = {
    'baby-clothes': ['3m', '6m', '9m', '12m', '18m', '24m'],
    'kids-shoes': Array.from({ length: 16 }, (_, i) => String(20 + i)), // 20-35
    'adult-shoes': Array.from({ length: 7 }, (_, i) => String(36 + i)), // 36-42
};

/**
 * Get available sizes for a given size option
 */
export function getSizesForOption(sizeOption: SizeOption): string[] {
    return SIZE_OPTIONS[sizeOption] || [];
}

/**
 * Get the display label for a size option category
 */
export function getSizeOptionLabel(sizeOption: SizeOption): string {
    const labels: Record<SizeOption, string> = {
        'baby-clothes': 'Baby Clothes',
        'kids-shoes': 'Kids Shoes',
        'adult-shoes': 'Adult Shoes',
    };
    return labels[sizeOption] || sizeOption;
}

/**
 * Validate if a size is valid for the given size option
 */
export function isValidSize(size: string, sizeOption: SizeOption): boolean {
    return SIZE_OPTIONS[sizeOption]?.includes(size) || false;
}
