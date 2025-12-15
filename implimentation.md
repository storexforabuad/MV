Ready-to-Wear (RTW) Fashion Store Implementation Plan
Goal Description
Create a new "Fashion" store type tailored for Ready-to-Wear brands. This focuses on robust variant management (Color/Size matrices), size guides, and visual inventory tracking.

User Review Required
IMPORTANT

New Product Type: FashionProduct will use a simplified structure. Inventory: We are removing explicit stock counts. Presence of a size implies it is available (1 of 1 model).

Proposed Changes
Types
[MODIFY] 
store.ts
Add 'fashion' to StoreMeta['storeType'].
[MODIFY] 
product.ts
Define FashionProduct interface with:
colors: Array of { name, hex, images }
sizes: Array of strings (Values: '6', '8', '10', ... '20')
soldOutSizes: Array of strings (Subset of sizes that are unavailable)
sizeChart: { type: 'nigerian-standard' }
Add FashionProduct to 
Product
 union type.
Admin Dashboard (/admin/[storeid])
[NEW] 
AddFashionComposer.tsx
Create a new composer component for adding fashion products.
Variant Builder:
Step 1: Add Colors (Name, Hex, Upload Images).
Step 2: Add Sizes (Multi-select from Standard 6-20).
Size Guide:
Display "Nigerian Standard Size Chart will be shown to customers".
[NEW] 
sizeUtils.ts
Export NIGERIAN_SIZE_CHART constant.
[MODIFY] 
EditProductPanel.tsx
Add logic to handle FashionProduct.
Render a "Size Availability" section:
List all sizes.
Render a toggle/checkbox for each.
If unchecked, add to soldOutSizes.
Render a "Color Management" section:
List existing colors (Image + Name).
"Add Color" button -> Opens mini-form to add Name, Hex, and Image.
"Remove" button per color.
Ensure Categories and Promo fields work for Fashion products (they share the same base fields).
[MODIFY] 
OrderDetails.tsx
Update to display selected variant (Color + Size) clearly.
Customer Storefront (/[storeid])
[MODIFY] 
ProductDetail.tsx
Update to handle FashionProduct.
Image Gallery: Filter images based on selected color.
Selectors:
Color Chips (Visual).
Size Chips (Disable if out of stock for selected color).
Size Guide: "Size Guide" button opening a modal.
[NEW] 
SizeGuideModal.tsx
Render the NIGERIAN_SIZE_CHART as a responsive table.
Highlight the row corresponding to the selected size (if any).
Order Summaries & Admin
[MODIFY] 
OrderSummaryModal.tsx
Update to display the selected Size and Color for fashion items.
[MODIFY] 
CartOrderSummaryModal.tsx
Update to display the selected Size and Color for fashion items.
[MODIFY] 
AdminOrdersModal.tsx
Update to display the selected Size and Color in the order list/details.
[MODIFY] 
DeliveriesHubModal.tsx
Update to display the selected Size and Color so the delivery person knows exactly what to pick.
Edge Cases & Mitigations
All Sizes Sold Out:
Scenario: Admin marks all sizes as sold out.
Handling: The product card and details page must automatically show the "Sold Out" badge and disable the "Place Order" button globally.
Cart Validation:
Scenario: User adds "Size 8" to cart -> Admin marks "Size 8" sold out -> User tries to checkout.
Handling: The validateCart function (or equivalent) must check soldOutSizes and block checkout, prompting the user to "remove the item that is sold out".
Color Deletion vs. Order History:
Scenario: Admin deletes "Red" color variant. A past order exists for "Red".
Handling: Ensure Order documents store a snapshot of the color name and image URL, rather than just a reference. This ensures past orders remain viewable even if the product data changes.
No Selection State:
Scenario: User lands on product page.
Handling: Do not auto-select a size/color to prevent accidental orders. Force the user to explicitly click a Color and a Size before the "Place Order" button becomes active.
Verification Plan
Manual Verification
Store Creation: Manually update a test store's type to 'fashion'.
Product Creation:
Go to /admin/[storeid].
Verify AddFashionComposer loads.
Create a product with Red/Blue colors and S/M/L sizes.
Set stock: Red/S = 0, Red/M = 5.
Customer Flow:
Go to /[storeid].
Open the new product.
Select "Red". Verify "S" is disabled/crossed out.
Select "Red" + "M". Add to cart.
Verify cart item shows "Red / M".
Order Processing:
Complete checkout.
Verify order details in Admin show "Red / M".