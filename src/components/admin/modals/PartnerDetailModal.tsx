'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, AlertCircle, CheckCircle, Plus, Minus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getPartnerProducts } from '@/app/actions/wholesaleActions';
import { StoreMeta } from '@/types/store';

interface Product {
  id: string;
  name?: string;
  originalPrice: number;
  wholesalePrice: number;
  discountApplied: number;
  stock: number;
  inventoryWarning: boolean;
  image?: string;
  images?: string[];
  description?: string;
  [key: string]: any;
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
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({}); // Track image load errors

  // Helper function to extract first image from product
  const getProductImage = (product: Product): string | undefined => {
    return product.images?.[0] || product.image;
  };

  // Detect motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

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
        const initialQuantities: Record<string, number> = {};
        (result.products as Product[]).forEach((p) => {
          initialQuantities[p.id] = 1;
        });
        setQuantities(initialQuantities);
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

    if (quantity <= 0) {
      return;
    }
    console.log(`[handleAddToCart] Adding product: ${product.name}, Qty: ${quantity}, Price: ₦${product.wholesalePrice}`);

    const existingItem = cartItems.find((item) => item.productId === product.id);
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: existingItem.quantity + quantity } : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          quantity,
          wholesalePrice: product.wholesalePrice,
          image: getProductImage(product),
        },
      ]);
    }

    toast.success(`Added ${quantity} × ${product.name}`);
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  const handleIncreaseQuantity = (productId: string) => {
    setQuantities({
      ...quantities,
      [productId]: (quantities[productId] || 1) + 1,
    });
  };

  const handleDecreaseQuantity = (productId: string) => {
    if ((quantities[productId] || 1) > 1) {
      setQuantities({
        ...quantities,
        [productId]: quantities[productId] - 1,
      });
    }
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

  // Memoize animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }), [prefersReducedMotion]);

  const itemVariants = useMemo(() => ({
    hidden: prefersReducedMotion ? {} : { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }), [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 max-sm:p-0"
          onClick={onClose}
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_16px_24px_-8px_rgba(0,0,0,0.12)] max-sm:fixed max-sm:inset-0 max-sm:rounded-none max-sm:max-h-screen max-sm:max-w-none max-sm:shadow-none flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[--button-primary] to-blue-500 p-4 md:p-6 text-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">{partner.name}</h2>
                {partner.wholesaleConfig?.minOrderValue && (
                  <p className="text-xs sm:text-sm text-white/80">Min Order: ₦{partner.wholesaleConfig.minOrderValue.toLocaleString()}</p>
                )}
              </div>
              <motion.button
                onClick={onClose}
                whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                className="p-2 hover:bg-white/20 rounded-xl transition"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Mobile Tab Bar */}
            <div className="md:hidden flex gap-2 p-4 border-b border-[--border-color] bg-white sticky top-16 z-20">
              <motion.button
                onClick={() => setActiveTab('products')}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                className={`flex-1 px-6 py-2 rounded-full font-semibold transition transform-gpu will-change-transform ${
                  activeTab === 'products'
                    ? 'bg-[--button-primary] text-white shadow-[0_4px_12px_-2px_rgba(0,113,227,0.25)]'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Browse Products
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('cart')}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                className={`flex-1 px-6 py-2 rounded-full font-semibold transition transform-gpu will-change-transform ${
                  activeTab === 'cart'
                    ? 'bg-[--button-primary] text-white shadow-[0_4px_12px_-2px_rgba(0,113,227,0.25)]'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Review Cart ({cartItems.length})
              </motion.button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Products Section */}
              <div className={`flex-1 overflow-y-auto p-4 md:p-6 bg-white ${activeTab === 'cart' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="rounded-full h-12 w-12 border-4 border-[--button-primary] border-t-transparent mb-4"
                    />
                    <p className="text-[--text-secondary]">Loading products...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
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
                  <motion.div
                    initial={itemVariants.hidden}
                    animate={itemVariants.visible}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-[--text-primary] font-semibold">No products available</p>
                    <p className="text-sm text-[--text-tertiary] mt-1">This partner has no products at this time</p>
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                        whileHover={prefersReducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
                        className="group relative rounded-2xl bg-white border border-[--border-color] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_24px_-8px_rgba(0,0,0,0.12)] transition-all duration-200 transform-gpu will-change-transform flex flex-col"
                      >
                        {/* Product Image with Hover Overlay */}
                        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center rounded-t-2xl">
                          {getProductImage(product) && !imageErrors[product.id] ? (
                            <>
                              <Image
                                src={getProductImage(product) || ''}
                                alt={product.name || 'Product'}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
                                sizes="(max-width: 640px) 400px, (max-width: 1024px) 600px, 800px"
                                priority={index < 2}
                                onError={() => {
                                  console.warn(`⚠️ Image failed to load for product: ${product.name}, URL: ${getProductImage(product)}`);
                                  setImageErrors((prev) => ({ ...prev, [product.id]: true }));
                                }}
                                blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect fill='%23f0f0f0' width='300' height='400'/%3E%3C/svg%3E"
                                placeholder="blur"
                              />
                              {/* Hover Overlay */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={prefersReducedMotion ? { opacity: 0 } : { opacity: 1 }}
                                className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                              />
                            </>
                          ) : (
                            /* Fallback placeholder when image missing or failed to load */
                            <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                              <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="text-xs text-gray-500">No image</p>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-0">
                          {/* Product Name */}
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-3 line-clamp-2">
                            {product.name}
                          </h3>

                          {/* Pricing Block */}
                          <div className="mb-3">
                            <div className="text-xl sm:text-2xl font-bold text-[--button-primary] mb-1">
                              ₦{product.wholesalePrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            {product.discountApplied > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-[--text-tertiary] line-through">
                                  ₦{product.originalPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <motion.span
                                  whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                                  className="text-xs font-bold text-[--success] bg-[--badge-green-bg] px-2 py-1 rounded-md transform-gpu will-change-transform"
                                >
                                  {product.discountApplied}% OFF
                                </motion.span>
                              </div>
                            )}
                          </div>

                          {/* Stock Info */}
                          {product.stock > 0 && (
                            <div className="text-xs text-[--text-tertiary] mb-3">
                              Stock: <span className="font-semibold text-[--text-secondary]">{product.stock}</span>
                            </div>
                          )}

                          {/* Quick Add - Quantity Controls + Button */}
                          <div className="flex items-center gap-2 mt-auto pt-3 border-t border-[--border-color]">
                            {/* Minus Button */}
                            <motion.button
                              onClick={() => handleDecreaseQuantity(product.id)}
                              disabled={(quantities[product.id] || 1) <= 1}
                              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                              className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition transform-gpu will-change-transform"
                            >
                              <Minus size={16} className="text-[--text-secondary]" />
                            </motion.button>

                            {/* Quantity Display */}
                            <span className="flex-shrink-0 w-8 text-center font-semibold text-sm text-[--text-primary]">
                              {quantities[product.id] || 1}
                            </span>

                            {/* Plus Button */}
                            <motion.button
                              onClick={() => handleIncreaseQuantity(product.id)}
                              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                              className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition transform-gpu will-change-transform"
                            >
                              <Plus size={16} className="text-[--text-secondary]" />
                            </motion.button>

                            {/* Add to Cart Button */}
                            <motion.button
                              onClick={() => handleAddToCart(product)}
                              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                              className="flex-1 bg-[--button-primary] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[--button-primary-hover] transition transform-gpu will-change-transform"
                            >
                              Add
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Cart Sidebar / Tab */}
              <div className={`w-full md:w-80 border-t md:border-t-0 md:border-l border-[--border-color] bg-gray-50/50 p-4 md:p-6 overflow-y-auto flex flex-col ${activeTab === 'products' ? 'hidden md:flex' : 'flex'}`}>
                <div className="hidden md:flex items-center gap-2 mb-4 md:mb-6 pb-4 border-b border-[--border-color]">
                  <ShoppingCart size={18} className="text-[--button-primary]" />
                  <h3 className="font-bold text-base sm:text-lg text-[--text-primary]">Cart ({cartItems.length})</h3>
                </div>

                {/* Cart Empty State */}
                {cartItems.length === 0 ? (
                  <motion.div
                    initial={itemVariants.hidden}
                    animate={itemVariants.visible}
                    className="flex-1 flex flex-col items-center justify-center py-8 md:py-12"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
                      <ShoppingCart size={32} className="text-gray-400" />
                    </div>
                    <p className="text-[--text-primary] font-semibold text-center mb-2">Your cart is empty</p>
                    <p className="text-sm text-[--text-tertiary] text-center mb-4">Browse our products to get started</p>
                    {activeTab === 'cart' && (
                      <motion.button
                        onClick={() => setActiveTab('products')}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                        className="text-[--button-primary] hover:text-[--button-primary-hover] font-medium text-sm"
                      >
                        Back to products
                      </motion.button>
                    )}
                  </motion.div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <motion.div
                      className="flex-1 space-y-2 mb-4 sm:mb-6 overflow-y-auto pr-2"
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                    >
                      {cartItems.map((item) => (
                        <motion.div
                          key={item.productId}
                          variants={itemVariants}
                          exit={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
                          className="bg-white rounded-xl p-2 sm:p-3 border border-[--border-color] shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <p className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1 text-[--text-primary]">{item.name}</p>
                            <motion.button
                              onClick={() => handleRemoveFromCart(item.productId)}
                              whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                              className="text-[--danger] hover:text-red-700 flex-shrink-0 transition transform-gpu will-change-transform"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <motion.button
                                onClick={() => handleUpdateCartQuantity(item.productId, item.quantity - 1)}
                                whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                                className="flex-shrink-0 w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition transform-gpu will-change-transform"
                              >
                                <Minus size={12} />
                              </motion.button>
                              <span className="flex-shrink-0 w-6 text-center font-semibold text-xs text-[--text-primary]">{item.quantity}</span>
                              <motion.button
                                onClick={() => handleUpdateCartQuantity(item.productId, item.quantity + 1)}
                                whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
                                className="flex-shrink-0 w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition transform-gpu will-change-transform"
                              >
                                <Plus size={12} />
                              </motion.button>
                            </div>
                            <div className="text-xs sm:text-sm font-semibold whitespace-nowrap text-[--text-primary]">
                              ₦{(item.wholesalePrice * item.quantity).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Payment Terms */}
                    <div className="mb-4 pb-4 border-b border-[--border-color]">
                      <label className="block text-xs sm:text-sm font-semibold text-[--text-primary] mb-2">Payment Terms</label>
                      <div className="space-y-1 sm:space-y-2">
                        {[
                          { value: 0, label: 'Pay on Delivery' },
                          { value: 7, label: '7 Days Credit' },
                          { value: 14, label: '14 Days Credit' },
                          { value: 30, label: '30 Days Credit' },
                        ].map((term) => (
                          <label key={term.value} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="paymentTerms"
                              value={term.value}
                              checked={selectedPaymentTerms === term.value}
                              onChange={() => setSelectedPaymentTerms(term.value as 0 | 7 | 14 | 30)}
                              className="cursor-pointer accent-[--button-primary]"
                            />
                            <span className="text-xs sm:text-sm text-[--text-secondary] group-hover:text-[--text-primary]">{term.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-[--border-color]">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-[--text-tertiary]">Subtotal</span>
                        <span className="font-semibold text-[--text-secondary]">
                          ₦{cartTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-[--border-color]">
                        <span className="text-[--text-primary]">Total</span>
                        <span className="text-[--button-primary]">
                          ₦{cartTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Validation Messages */}
                    <AnimatePresence>
                      {minOrder > 0 && cartTotal < minOrder && (
                        <motion.div
                          initial={itemVariants.hidden}
                          animate={itemVariants.visible}
                          exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                          className="bg-red-50 border border-red-200 rounded-xl p-2 sm:p-3 mb-3 flex items-start gap-2"
                        >
                          <AlertCircle size={14} className="text-[--danger] mt-0.5 flex-shrink-0 min-w-fit" />
                          <p className="text-xs text-red-700">
                            Minimum order: ₦{minOrder.toLocaleString()}
                            <br />
                            Add ₦{(minOrder - cartTotal).toLocaleString()} more
                          </p>
                        </motion.div>
                      )}

                      {cartItems.length > 0 && canProceed && (
                        <motion.div
                          initial={itemVariants.hidden}
                          animate={itemVariants.visible}
                          exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                          className="bg-[--badge-green-bg] border border-[--success]/30 rounded-xl p-2 sm:p-3 mb-3 flex items-start gap-2"
                        >
                          <CheckCircle size={14} className="text-[--success] mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-[--success]">Ready to proceed!</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Buttons */}
                <div className="space-y-2 pt-4 border-t border-[--border-color] mt-auto">
                  <motion.button
                    onClick={handleProceedToReview}
                    disabled={!canProceed || cartItems.length === 0}
                    whileHover={!canProceed || cartItems.length === 0 ? {} : prefersReducedMotion ? {} : { scale: 1.02 }}
                    whileTap={!canProceed || cartItems.length === 0 ? {} : prefersReducedMotion ? {} : { scale: 0.98 }}
                    className="w-full bg-[--button-primary] text-white py-3 rounded-xl font-semibold hover:bg-[--button-primary-hover] disabled:bg-gray-300 disabled:cursor-not-allowed transition transform-gpu will-change-transform"
                  >
                    Review Order
                  </motion.button>
                  <motion.button
                    onClick={onClose}
                    whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    className="w-full border border-[--border-color] text-[--text-primary] py-2 rounded-xl font-semibold hover:bg-gray-100 transition transform-gpu will-change-transform"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
