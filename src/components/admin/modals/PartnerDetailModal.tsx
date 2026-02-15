'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import { getPartnerProducts } from '@/app/actions/wholesaleActions';
import { StoreMeta } from '@/types/store';

interface Product {
  id: string;
  name?: string; // From product spread
  originalPrice: number;
  wholesalePrice: number;
  discountApplied: number;
  stock: number;
  inventoryWarning: boolean;
  image?: string;
  description?: string;
  [key: string]: any; // Allow other properties from product spread
}

interface CartItem {
  productId: string;
  name?: string;
  quantity: number;
  wholesalePrice: number;
  image?: string;
}

interface PartnerDetailModalProps {
  partner: StoreMeta;
  buyerStoreId: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderReview: (items: CartItem[], total: number, paymentTerms: number) => void;
}

export function PartnerDetailModal({
  partner,
  buyerStoreId,
  isOpen,
  onClose,
  onOrderReview,
}: PartnerDetailModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<0 | 7 | 14 | 30>(0);

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen && partner.id) {
      fetchProducts();
    }
  }, [isOpen, partner.id]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔄 [PartnerDetailModal] Fetching products for ${partner.name}`);
      const result = await getPartnerProducts(partner.id!, buyerStoreId);
      
      console.log(`📊 [PartnerDetailModal] Result:`, result);
      
      if (result.success) {
        console.log(`✅ [PartnerDetailModal] Got ${result.products?.length || 0} products`);
        setProducts(result.products as Product[]);
        if (!result.products || result.products.length === 0) {
          setError('Partner has no products available at this time');
        }
      } else {
        console.error(`❌ [PartnerDetailModal] Error:`, result.error);
        setError(result.error || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('❌ [PartnerDetailModal] Exception:', err);
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;

    // Allow ordering even with 0 stock (backorder support)
    if (quantity <= 0) {
      return;
    }
    console.log(`[handleAddToCart] Adding product: ${product.name}, Qty: ${quantity}, Price: ₦${product.wholesalePrice}`);

    // Check if item already in cart
    const existingItem = cartItems.find((item) => item.productId === product.id);
    if (existingItem) {
      // Update quantity
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: existingItem.quantity + quantity } : item
        )
      );
    } else {
      // Add new item
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          quantity,
          wholesalePrice: product.wholesalePrice,
          image: product.image,
        },
      ]);
    }

    // Reset quantity input
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setQuantities({ ...quantities, [productId]: num });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.wholesalePrice * item.quantity, 0);
  };

  const handleProceedToReview = () => {
    const total = calculateTotal();
    if (cartItems.length === 0) {
      setError('Please add items to cart');
      return;
    }
    onOrderReview(cartItems, total, selectedPaymentTerms);
  };

  const wholesaleConfig = (partner.wholesaleConfig || { minOrderValue: 0 }) as any;
  const minOrder = (wholesaleConfig?.minOrderValue as number) || 0;
  const cartTotal = calculateTotal();
  const canProceed = cartTotal >= minOrder;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 max-sm:p-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl max-sm:fixed max-sm:inset-0 max-sm:rounded-none max-sm:max-h-screen max-sm:max-w-none max-sm:shadow-none flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">{partner.name}</h2>
                {partner.wholesaleConfig?.minOrderValue && (
                  <p className="text-xs sm:text-sm text-blue-100">Min Order: ₦{partner.wholesaleConfig.minOrderValue.toLocaleString()}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-500 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Products Section */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 max-sm:flex-none">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                    <p className="text-gray-600">Loading products...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
                    <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-2">{error}</p>
                      <button
                        onClick={fetchProducts}
                        className="text-sm text-red-700 hover:text-red-800 font-medium underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No products available</p>
                    <p className="text-sm text-gray-500 mt-1">This partner has no products at this time</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                      >
                        {/* Product Image */}
                        {product.image && (
                          <div className="h-32 sm:h-40 bg-gray-100 overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="p-3 sm:p-4">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">
                            {product.name}
                          </h3>

                          {/* Pricing */}
                          <div className="flex items-end gap-2 mb-3 flex-wrap">
                            <div className="text-lg sm:text-xl font-bold text-blue-600">
                              ₦{product.wholesalePrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            {product.discountApplied > 0 && (
                              <>
                                <div className="text-xs sm:text-sm line-through text-gray-500">
                                  ₦{product.originalPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">
                                  {product.discountApplied}% OFF
                                </div>
                              </>
                            )}
                          </div>

                          {/* Inventory Warning */}
                          {product.inventoryWarning && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 flex items-start gap-2">
                              <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-yellow-700">
                                Low stock: {product.stock} left
                              </p>
                            </div>
                          )}

                          {/* Stock Info */}
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">
                            Stock: <span className="font-semibold">{product.stock}</span>
                          </p>

                          {/* Quantity Input & Add Button */}
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              value={quantities[product.id] || 1}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              className="w-14 sm:w-16 px-2 py-2 border border-gray-300 rounded text-center text-sm"
                            />
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={!quantities[product.id] || quantities[product.id] <= 0}
                              className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 transition"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 p-4 md:p-6 overflow-y-auto flex flex-col max-sm:max-h-[35vh] md:max-h-full">
                <div className="flex items-center gap-2 mb-4 md:mb-6 pb-4 border-b border-gray-200">
                  <ShoppingCart size={18} className="text-blue-600" />
                  <h3 className="font-bold text-base sm:text-lg">Cart ({cartItems.length})</h3>
                </div>

                {/* Cart Items */}
                <div className="flex-1 space-y-2 mb-4 sm:mb-6 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">Cart is empty</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.productId} className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 text-sm sm:text-base">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <p className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1">{item.name}</p>
                          <button
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="text-red-600 hover:text-red-700 flex-shrink-0 text-lg"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateCartQuantity(item.productId, parseInt(e.target.value) || 1)
                              }
                              className="w-10 sm:w-12 px-2 py-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                            />
                            <span className="text-xs text-gray-600">×</span>
                          </div>
                          <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                            ₦{(item.wholesalePrice * item.quantity).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Payment Terms */}
                <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Payment Terms</label>
                  <div className="space-y-1 sm:space-y-2">
                    {[
                      { value: 0, label: 'Pay on Delivery' },
                      { value: 7, label: '7 Days Credit' },
                      { value: 14, label: '14 Days Credit' },
                      { value: 30, label: '30 Days Credit' },
                    ].map((term) => (
                      <label key={term.value} className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentTerms"
                          value={term.value}
                          checked={selectedPaymentTerms === term.value}
                          onChange={() => setSelectedPaymentTerms(term.value as 0 | 7 | 14 | 30)}
                          className="cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm text-gray-700">{term.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      ₦{cartTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-600">
                      ₦{cartTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Validation Messages */}
                {minOrder > 0 && cartTotal < minOrder && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">
                      Minimum order: ₦{minOrder.toLocaleString()}
                      <br />
                      Add ₦{(minOrder - cartTotal).toLocaleString()} more
                    </p>
                  </div>
                )}

                {cartItems.length > 0 && canProceed && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700">Ready to proceed!</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleProceedToReview}
                    disabled={!canProceed || cartItems.length === 0}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
                  >
                    Review Order
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
