Ready-to-Wear (RTW) Fashion Store Features
Core Concept
A specialized store type for fashion brands selling pre-made clothing in standard sizes. The focus is on visual appeal, size guidance, and inventory management for variants (Size/Color).

1. Data Structure Updates
Store Type
Add 'fashion' to StoreMeta['storeType'].
Product Type (FashionProduct)
Type Identifier: productType: 'fashion'
Variants:
colors: Array of { name, hexCode, images: [] }
sizes: Array of string (Strictly Nigerian Sizes: 6, 8, 10, 12, 14, 16, 18, 20)
soldOutSizes: Array of string (List of sizes currently unavailable)
Inventory Assumption: 1 of 1 per variant.
Size Guide (Nigerian Standard):
Built-in support for the standard Nigerian sizing chart (Sizes 6-20).
Data Structure:
measurements: Map of Size -> { Bust, Waist, Hips }
2. Customer Facing Features (/[storeid])
Product Page
Variant Selector:
Color Swatches: Circular chips with the actual color. Selecting a color filters the main image gallery.
Size Selector: Standard chips (6, 8, 10, etc.).
Action Buttons:
Primary: "Place Order" (Green, full width).
Secondary: Heart (Wishlist) and Cart icon buttons.
Interactive Size Guide:
"Size Guide" button opens a modal displaying the structured table (Bust/Waist/Hips).
Highlight: If user knows their measurements, highlight the row that fits them.
3. Admin Facing Features (/admin/[storeid])
Product Management
Fashion Composer:
Variant Builder:
Add Colors:
Admin Composer: Create AddFashionComposer.tsx with the matrix inventory input.
Store Frontend: Update ProductDetail.tsx to handle variant selection logic (updating images and stock availability dynamically).