// Fashion size category type
export type FashionSizeCategory = 'clothing' | 'shoes';

// Nigerian/UK Standard Clothing Sizes (6-20)
export const NIGERIAN_SIZE_CHART = [
    { size: '6', bust: 32, waist: 26, hips: 36 },
    { size: '8', bust: 34, waist: 28, hips: 40 },
    { size: '10', bust: 36, waist: 30, hips: 42 },
    { size: '12', bust: 38, waist: 33, hips: 44 },
    { size: '14', bust: 40, waist: 36, hips: 46 },
    { size: '16', bust: 42, waist: 39, hips: 49 },
    { size: '18', bust: 45, waist: 42, hips: 51 },
    { size: '20', bust: 48, waist: 45, hips: 54 },
];

// European Shoe Sizes (38-46) with foot length in cm
export const EUROPEAN_SHOE_CHART = [
    { size: '38', footLength: 24.0 },
    { size: '39', footLength: 24.5 },
    { size: '40', footLength: 25.3 },
    { size: '41', footLength: 26.0 },
    { size: '42', footLength: 26.7 },
    { size: '43', footLength: 27.3 },
    { size: '44', footLength: 28.0 },
    { size: '45', footLength: 28.8 },
    { size: '46', footLength: 29.5 },
];

// Helper to get sizes for a given fashion category
export const getSizesForFashionCategory = (category: FashionSizeCategory): string[] => {
    return category === 'clothing'
        ? NIGERIAN_SIZE_CHART.map(item => item.size)
        : EUROPEAN_SHOE_CHART.map(item => item.size);
};
