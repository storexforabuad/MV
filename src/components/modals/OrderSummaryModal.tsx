'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Product } from '@/types/product';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { formatPrice } from '@/utils/price';
import { Minus, Plus, Loader2, MessageSquare, ExternalLink, AlertCircle, Smartphone, Activity, Database, Cpu, Network, ShieldCheck, Package, Fingerprint, Info, Code, Battery, Headphones, VolumeX, Gamepad2, Zap, Watch, Cable, Link, Sun, Layers, RefreshCw, Gauge, Monitor, Wifi } from 'lucide-react';
import { ElectronicsProduct } from '@/types/product';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '@/hooks/useOrders';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { getCustomerDetails } from '@/app/actions/customerActions';
import { isFoodBeverageProduct, isFashionProduct, isElectronicsProduct, isSolarProduct } from '@/utils/productHelpers';
import { shouldUsePaymentFlow } from '@/utils/storeHelpers';
import { saveModalState, getModalState, clearModalState } from '@/lib/paymentModalStorage';
import { requestCustomerNotificationPermission } from '@/lib/requestCustomerNotifications';
import PaymentFlowPage from './PaymentFlowPage';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import { shouldShowWhatsAppPreview } from '@/utils/storeHelpers';
import WhatsAppPreviewPage from './WhatsAppPreviewPage';

const SPICINESS_LEVELS = [
  { value: 'mild', label: '😌 Mild', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'medium', label: '🌶️ Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'hot', label: '🔥 Hot', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'extra-hot', label: '🤯 Extra Hot', color: 'bg-red-100 text-red-800 border-red-200' },
];

const DEFAULT_PRODUCT_IMAGE = '/default_product_800x800.png';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  storeMeta: StoreMeta | null;
  customer: Customer | null;
  selectedSize?: string;
  selectedColor?: string;
  initialQuantity?: number;
  openedFrom?: 'productDetails' | 'productCard';
}

export default function OrderSummaryModal({ isOpen, onClose, product, storeMeta, customer: initialCustomer, selectedSize, selectedColor, initialQuantity = 1, openedFrom, isReorder = false }: OrderSummaryModalProps) {
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedSpiciness, setSelectedSpiciness] = useState('medium');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [uploadedEvidence, setUploadedEvidence] = useState<{ url: string; fileName: string } | undefined>();
  const [imageLoading, setImageLoading] = useState(true);
  const [showLeaveAppConfirmation, setShowLeaveAppConfirmation] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);

  // Interactive color and size selection state
  const [interactiveSelectedColor, setInteractiveSelectedColor] = useState<string | undefined>(selectedColor);
  const [interactiveSelectedSize, setInteractiveSelectedSize] = useState<string | undefined>(selectedSize);
  const [currentProductImage, setCurrentProductImage] = useState<string>(product?.images?.[0] || DEFAULT_PRODUCT_IMAGE);

  const hasPushedState = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

  const routeParams = useParams();
  const storeId = typeof routeParams?.storeId === 'string' ? routeParams.storeId : Array.isArray(routeParams?.storeId) ? routeParams.storeId[0] : undefined;
  const { addOrder } = useOrders(customer?.id || null, storeId!);

  const isPaymentFlowEnabled = shouldUsePaymentFlow(storeMeta?.storeType, storeMeta?.subscriptionStatus);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity);

      // Shortcut: skip specs page if opening from product details
      if (product && (isElectronicsProduct(product) || isSolarProduct(product)) && openedFrom === 'productDetails') {
        setCurrentPage(2);
      } else {
        setCurrentPage(1);
      }

      setSelectedSpiciness('medium');
      setSpecialInstructions('');
      setUploadedEvidence(undefined);
      setShowLeaveAppConfirmation(false);
      setHasPlacedOrder(false);
      setShowSizeError(false);
      setInteractiveSelectedColor(selectedColor);
      setInteractiveSelectedSize(selectedSize);
      setImageLoading(true);

      // Restore modal state from localStorage if payment flow is enabled
      if (isPaymentFlowEnabled && storeId) {
        const savedState = getModalState(storeId);
        if (savedState) {
          setCurrentPage(savedState.currentPage);
          if (savedState.evidenceUrl) {
            setUploadedEvidence({
              url: savedState.evidenceUrl,
              fileName: savedState.fileName || 'Uploaded proof'
            });
          }
        }
      }

      if (initialCustomer) {
        getCustomerDetails(initialCustomer.id).then(details => {
          if (details) {
            setCustomer(details);
          }
        });
      }
    }
  }, [isOpen, initialCustomer, isPaymentFlowEnabled, storeId]);

  // Dedicated history management effect
  useEffect(() => {
    if (!isOpen) return;

    // Push state to handle back button only once
    if (!hasPushedState.current) {
      window.history.pushState({ modal: 'order-summary' }, '');
      hasPushedState.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      if (hasPushedState.current) {
        hasPushedState.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If modal is closed via X button, we need to clean up the history state
      if (hasPushedState.current) {
        hasPushedState.current = false;
        if (window.history.state?.modal === 'order-summary') {
          window.history.back();
        }
      }
    };
  }, [isOpen]);

  // Reset scroll position when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Update product image when color changes
  useEffect(() => {
    if (product && isFashionProduct(product) && interactiveSelectedColor && (product as any).colors) {
      const colorData = (product as any).colors.find((c: any) => c.name === interactiveSelectedColor || c.hex === interactiveSelectedColor);
      if (colorData && colorData.images && colorData.images.length > 0) {
        setCurrentProductImage(colorData.images[0]);
      } else if (product.images && product.images.length > 0) {
        setCurrentProductImage(product.images[0]);
      } else {
        setCurrentProductImage(DEFAULT_PRODUCT_IMAGE);
      }
    } else if (product && product.images && product.images.length > 0) {
      setCurrentProductImage(product.images[0]);
    } else {
      setCurrentProductImage(DEFAULT_PRODUCT_IMAGE);
    }
  }, [interactiveSelectedColor, product]);

  // Reset hasPlacedOrder if any order details change
  useEffect(() => {
    setHasPlacedOrder(false);
  }, [quantity, deliveryMethod, selectedSpiciness, specialInstructions, interactiveSelectedSize, interactiveSelectedColor, product?.id]);

  if (!product) return null;

  const isElectronics = isElectronicsProduct(product);
  const isSolar = isSolarProduct(product);
  const summaryPageNum = (isElectronics || isSolar) ? 2 : 1;
  const paymentPageNum = (isElectronics || isSolar) ? 3 : 2;

  const hasSizes = (p: any) => {
    return (p.sizes && p.sizes.length > 0) || (p.sizeOption && p.sizeOption.length > 0);
  };

  const getSizes = (p: any): string[] => {
    return p.sizes || p.sizeOption || [];
  };

  const total = product.price * quantity;

  const handleEvidenceUploaded = (evidenceUrl: string, fileName: string) => {
    setUploadedEvidence({ url: evidenceUrl, fileName });
    if (storeId) {
      saveModalState(storeId, 2, evidenceUrl, fileName);
    }
  };

  const handlePlaceOrder = async () => {
    if (!product || !storeId || !storeMeta) return;

    if (isPaymentFlowEnabled && !customer) {
      toast.error('Please log in to use the secure payment flow');
      return;
    }

    if (isPaymentFlowEnabled && !uploadedEvidence) {
      toast.error('Please upload payment evidence first');
      return;
    }

    if (hasPlacedOrder && !isPaymentFlowEnabled) {
      setCurrentPage(paymentPageNum as any);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const storeMetaWithId = { ...storeMeta, id: storeId };
      const referrerId = localStorage.getItem('referrerId');

      const productToOrder = {
        ...product,
        quantity,
        selectedSize: interactiveSelectedSize,
        selectedColor: interactiveSelectedColor,
        selectedSpiciness: isFoodBeverageProduct(product) ? selectedSpiciness : undefined,
        specialInstructions: isFoodBeverageProduct(product) ? specialInstructions : undefined
      };

      if (isPaymentFlowEnabled) {
        if (!customer) throw new Error("Customer session not found");
        await addOrder(
          [productToOrder],
          storeMetaWithId,
          customer,
          referrerId,
          false,
          deliveryMethod as 'home' | 'pickup',
          '',
          uploadedEvidence?.url,
          uploadedEvidence?.fileName
        );

        if (customer?.id) {
          requestCustomerNotificationPermission(customer.id).catch(err =>
            console.error('Failed to request notification permission:', err)
          );
        }

        toast.success('Order placed! Vendor will review your payment and confirm shortly.');
        clearModalState(storeId);
        onClose();
      } else {
        const guestInfo = (customer || {
          id: 'guest',
          name: 'Guest Customer',
          phoneNumber: '',
          deliveryAddress: { street: '', state: '', country: '' }
        }) as Customer;

        await addOrder([productToOrder], storeMetaWithId, guestInfo, referrerId, false, deliveryMethod as 'home' | 'pickup');

        if (customer?.id) {
          requestCustomerNotificationPermission(customer.id).catch(err =>
            console.error('Failed to request notification permission:', err)
          );
        }

        // toast.success('Order placed! Redirecting to WhatsApp...');

        const productUrl = `https://tinyurl.com/bizconnet/${storeId}/products/${product.id}`;
        const message = `🛍️ *${isReorder ? 'Reorder Request' : 'New Order Request'}*\n\n` +
          `Hello! I would like to ${isReorder ? 'reorder' : 'order'} this item:\n\n` +
          `*${product.name.trim()}*\n` +
          `🔗 *Product Link:* ${productUrl}\n` +
          `🔢 *Quantity:* ${quantity} ${product.productType === 'livestock' ? ((product as any).priceUnit === 'kg' ? 'kg' : 'pcs') : ''}\n` +
          (interactiveSelectedColor ? `🎨 *Color:* ${interactiveSelectedColor}\n` : '') +
          (interactiveSelectedSize ? `📏 *Size:* ${interactiveSelectedSize}\n` : '') +
          (isFoodBeverageProduct(product) ? `🌶️ *Spiciness:* ${SPICINESS_LEVELS.find(s => s.value === selectedSpiciness)?.label}\n` : '') +
          (isFoodBeverageProduct(product) && specialInstructions ? `📝 *Note:* ${specialInstructions}\n` : '') +
          (isSolarProduct(product) ? (
            (product.subtype === 'solar-panels' ? `☀️ *Panel Specs:* ${product.wattage}${product.cellType ? ` (${product.cellType})` : ''}${product.efficiencyRating ? `, Efficiency: ${product.efficiencyRating}` : ''}\n` : '') +
            (product.subtype === 'inverters' ? `🔄 *Inverter Specs:* ${product.powerCapacity}${product.inverterType ? ` (${product.inverterType})` : ''}${product.systemVoltage ? `, System: ${product.systemVoltage}` : ''}\n` : '') +
            (product.subtype === 'batteries' ? `🔋 *Battery:* ${product.batteryCapacity}${product.batteryChemistry ? ` (${product.batteryChemistry})` : ''}${product.lifeCycles ? `, cycles: ${product.lifeCycles}` : ''}\n` : '') +
            (product.subtype === 'charge-controllers' ? `🎛️ *Controller:* ${product.maxCurrentRating}${product.controllerType ? ` (${product.controllerType})` : ''}\n` : '') +
            (product.subtype === 'dc-appliances' || product.subtype === 'ac-appliances' ? `⚡ *Power:* ${product.powerConsumption}${product.energyStarRating ? ` (${product.energyStarRating})` : ''}\n` : '') +
            (product.subtype === 'solar-kits' ? `📦 *Kit Capacity:* ${product.totalSystemCapacity}${product.estimatedDailyYield ? ` (Yield: ${product.estimatedDailyYield})` : ''}\n` : '')
          ) : '') +
          `💰 *Price:* ${formatPrice(product.price)}\n` +
          `🚚 *Delivery Method:* ${deliveryMethod === 'home' ? 'Home Delivery' : 'Pick Up'}\n` +
          `${deliveryMethod === 'home' ? (customer?.deliveryAddress?.street ? `📍 *To:* ${customer.deliveryAddress.street}\n` : '📍 *Address:* (Please provide your address below)\n') : ''}` +
          `*Total (excluding delivery):* ${formatPrice(total)}\n\n` +
          `Please provide delivery fee and payment details.\n\n` +
          `Thank you! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodedMessage}`;

        if (shouldShowWhatsAppPreview(storeMeta.storeType)) {
          setWhatsappMessage(message);
          setHasPlacedOrder(true);
          setCurrentPage(paymentPageNum as any);
        } else {
          window.open(whatsappUrl, '_blank');
          // Small delay to ensure the redirect is triggered before closing the modal
          setTimeout(() => {
            onClose();
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleBackToSummary = () => {
    setCurrentPage(summaryPageNum as any);
    if (storeId) {
      saveModalState(storeId, summaryPageNum, uploadedEvidence?.url, uploadedEvidence?.fileName);
    }
  };

  const handleProceedToPayment = () => {
    setCurrentPage(paymentPageNum as any);
    if (storeId) {
      saveModalState(storeId, paymentPageNum, uploadedEvidence?.url, uploadedEvidence?.fileName);
    }
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="relative w-full transform overflow-hidden rounded-t-[2rem] bg-white dark:bg-modal-background text-left align-middle shadow-2xl transition-all flex flex-col max-h-[92vh] sm:max-w-2xl sm:rounded-2xl sm:max-h-[85vh]">

                  {/* Handle Bar for Mobile */}
                  <div className="flex-shrink-0 pt-3 pb-1 flex justify-center sm:hidden">
                    <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                  </div>

                  {/* Header */}
                  <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-modal-background">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      {currentPage === 1 && (isElectronics || isSolar) ? 'Product Specifications' : currentPage === summaryPageNum ? 'Order Summary' : (isPaymentFlowEnabled ? 'Payment' : 'WhatsApp Preview')}
                    </h3>
                    <button
                      type="button"
                      className="flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors shadow-sm"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <style jsx global>{`
                    @keyframes shake {
                      0%, 100% { transform: translateX(0); }
                      25% { transform: translateX(-4px); }
                      75% { transform: translateX(4px); }
                    }
                    .animate-shake {
                      animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                    }
                  `}</style>

                  {/* Main Content */}
                  <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4 sm:p-6">
                    <div className="max-w-3xl mx-auto w-full">
                      {/* Page 1 (Electronics Specs - "Device Passport") */}
                      {currentPage === 1 && isElectronics && (() => {
                        const elecProduct = product as ElectronicsProduct;
                        return (
                          <div className="pt-2 sm:pt-4 space-y-6">
                            {/* Product Header Card */}
                            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                                <Image src={currentProductImage} alt={product.name} fill sizes="80px" className="object-cover" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h4>
                                {elecProduct.brand && <p className="text-sm font-medium text-gray-500 mt-0.5">{elecProduct.brand}</p>}
                                <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">{formatPrice(product.price)}</p>
                              </div>
                            </div>

                            {/* Device Passport Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Common: Condition */}
                              {elecProduct.condition && (
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${elecProduct.condition === 'brand-new' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                    <Activity className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Condition</span>
                                    <p className="font-bold text-[13px] text-gray-900 dark:text-white capitalize">{elecProduct.condition.replace('-', ' ')}</p>
                                  </div>
                                </div>
                              )}

                              {/* Dynamic Fields by Subtype */}
                              {(() => {
                                switch (elecProduct.subtype) {
                                  case 'powerbank':
                                    return (
                                      <>
                                        {elecProduct.batteryCapacity && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                              <Battery className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Capacity</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.batteryCapacity}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.powerOutput && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                              <Zap className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Output</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.powerOutput}</p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  case 'audio':
                                    return (
                                      <>
                                        {elecProduct.audioStyle && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                              <Headphones className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Style</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.audioStyle}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.anc && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                              <VolumeX className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Noise Cancellation</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">Active (ANC)</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.batteryCapacity && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                              <Battery className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Battery</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.batteryCapacity}</p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  case 'smartwatch':
                                    return (
                                      <>
                                        {elecProduct.watchBatteryLife && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                              <Battery className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Battery Life</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.watchBatteryLife}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.connectivity && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                              <Network className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Connectivity</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.connectivity}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.os && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                              <Code className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">OS</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.os}</p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  case 'gaming':
                                    return (
                                      <>
                                        {elecProduct.gamingCategory && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                              <Gamepad2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Category</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.gamingCategory}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.gamingPlatform && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                              <Cpu className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Platform</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white truncate" title={elecProduct.gamingPlatform}>{elecProduct.gamingPlatform}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.storage && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                              <Database className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Storage</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.storage}</p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  case 'accessory':
                                    return (
                                      <>
                                        {elecProduct.accessoryType && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                              <Cable className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Type</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.accessoryType}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.connectivity && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                              <Link className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Connectivity</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.connectivity}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.compatibleWith && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2 col-span-2">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Smartphone className="w-4 h-4 text-emerald-500" />
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Compatible With</span>
                                            </div>
                                            <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.compatibleWith}</p>
                                          </div>
                                        )}
                                      </>
                                    );
                                  case 'phone':
                                  case 'tablet':
                                  case 'laptop':
                                  default:
                                    return (
                                      <>
                                        {elecProduct.batteryCapacity && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                              <Battery className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Battery</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.batteryCapacity}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.storage && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                              <Database className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Storage</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.storage}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.ram && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                              <Cpu className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Memory</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.ram}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.os && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                              <Code className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">OS</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.os}</p>
                                            </div>
                                          </div>
                                        )}
                                        {elecProduct.network && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                              <Network className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Network</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.network}</p>
                                            </div>
                                          </div>
                                        )}
                                        {(elecProduct.imeiVerification || (elecProduct as any).imeiVerified !== undefined) && (
                                          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                                              <Fingerprint className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Verification</span>
                                              <p className="font-bold text-[13px] text-gray-900 dark:text-white capitalize">
                                                {elecProduct.imeiVerification ? (elecProduct.imeiVerification === 'verified' ? '✅ Verified' : 'Not Verified') :
                                                  ((elecProduct as any).imeiVerified ? '✅ Verified' : 'Not Verified')}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                }
                              })()}

                              {/* Common: Box Items & Warranty */}
                              {elecProduct.packageContents && (
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2 col-span-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Package className="w-4 h-4 text-yellow-500" />
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Box Items</span>
                                  </div>
                                  <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.packageContents}</p>
                                </div>
                              )}
                              {elecProduct.warranty && elecProduct.warrantyDuration && (
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Warranty</span>
                                    <p className="font-bold text-[13px] text-gray-900 dark:text-white">{elecProduct.warrantyDuration}</p>
                                  </div>
                                </div>
                              )}

                            </div>

                            {/* Vendor Notes Section (Description) */}
                            {product.description && (
                              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Notes from Vendor</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                  "{product.description}"
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Page 1 (Solar Specs) */}
                      {currentPage === 1 && isSolar && (() => {
                        const s = product as any;
                        return (
                          <div className="pt-2 sm:pt-4 space-y-6">
                            {/* Product Header Card */}
                            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                                <Image src={currentProductImage} alt={product.name} fill sizes="80px" className="object-cover" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h4>
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{formatPrice(product.price)}</p>
                              </div>
                            </div>

                            {/* Tech Specs Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {s.subtype === 'solar-panels' && (
                                <>
                                  {s.wattage && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <Sun className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Wattage</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.wattage}</p>
                                      </div>
                                    </div>
                                  )}
                                  {s.cellType && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Layers className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Cell Type</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white capitalize">{s.cellType}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {s.subtype === 'inverters' && (
                                <>
                                  {s.powerCapacity && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <RefreshCw className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Capacity</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.powerCapacity}</p>
                                      </div>
                                    </div>
                                  )}
                                  {s.inverterType && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                        <Activity className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Type</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.inverterType}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {s.subtype === 'batteries' && (
                                <>
                                  {s.batteryCapacity && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <Battery className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Capacity</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.batteryCapacity}</p>
                                      </div>
                                    </div>
                                  )}
                                  {s.batteryChemistry && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Fingerprint className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Chemistry</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white capitalize">{s.batteryChemistry}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {s.subtype === 'charge-controllers' && (
                                <>
                                  {s.maxCurrentRating && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <Gauge className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Max Current</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.maxCurrentRating}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {(s.subtype === 'dc-appliances' || s.subtype === 'ac-appliances') && (
                                <>
                                  {s.powerConsumption && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <Zap className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Consumption</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.powerConsumption}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {s.subtype === 'solar-kits' && (
                                <>
                                  {s.totalSystemCapacity && (
                                    <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <Package className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Kit Capacity</span>
                                        <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.totalSystemCapacity}</p>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Common Warranty */}
                              {s.warranty && s.warrantyDuration && (
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Warranty</span>
                                    <p className="font-bold text-[13px] text-gray-900 dark:text-white">{s.warrantyDuration}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {product.description && (
                              <div className="p-6 rounded-[2rem] bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                                {(isElectronicsProduct(product) || isSolarProduct(product)) && (
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                                      <Info className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Unit Condition & Notes</h3>
                                  </div>
                                )}
                                <p className={`text-gray-600 dark:text-gray-300 leading-relaxed ${(isElectronicsProduct(product) || isSolarProduct(product)) ? 'text-sm' : 'text-sm italic'}`}>
                                  {isElectronicsProduct(product) || isSolarProduct(product) ? product.description : `"${product.description}"`}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Summary Page */}
                      {currentPage === summaryPageNum && (
                        <div className="pt-4 sm:pt-8">
                          {/* Product Details */}
                          <div className="flex items-center space-x-4">
                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900 shadow-inner">
                              <div className={`absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-shimmer bg-[length:200%_100%] transition-opacity duration-300 ${imageLoading ? 'opacity-100' : 'opacity-0'}`} />
                              <Image
                                src={currentProductImage}
                                alt={product.name}
                                width={80}
                                height={80}
                                className={`h-20 w-20 object-cover relative z-10 transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={() => setImageLoading(false)}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white">{product.name}</h4>
                              <div className="mt-1 mb-2 flex flex-wrap gap-2">
                                {interactiveSelectedColor && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                    🎨 {interactiveSelectedColor}
                                  </span>
                                )}
                                {interactiveSelectedSize && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                    📏 {interactiveSelectedSize}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {formatPrice(product.price)}
                                {product.productType === 'livestock' && (
                                  <span>/{(product as any).priceUnit === 'kg' ? 'kg' : 'pc'}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                                {product.productType === 'livestock' && (product as any).priceUnit === 'kg' ? 'Kilos' : 'Quantity'}
                              </span>
                              <div className="flex items-center gap-3">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"><Minus size={18} /></button>
                                <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[1.5rem] text-center">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"><Plus size={18} /></button>
                              </div>
                            </div>
                          </div>

                          {/* Variant Selection (Color/Size) */}
                          <div className="space-y-6">
                            {/* Color Selection - For Products with Colors */}
                            {(product as any).colors && (product as any).colors.length > 0 && (
                              <div className="mt-8">
                                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">
                                  🎨 Select Color
                                </label>
                                <div className="flex flex-wrap gap-3">
                                  {(product as any).colors.map((color: any) => (
                                    <button
                                      key={color.name}
                                      onClick={() => setInteractiveSelectedColor(color.name)}
                                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${interactiveSelectedColor === color.name
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                      <div
                                        className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"
                                        style={{ backgroundColor: color.hex }}
                                      />
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{color.name}</span>
                                      {interactiveSelectedColor === color.name && (
                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Size Selection - For Products with Sizes */}
                            {hasSizes(product) && (
                              <div ref={sizeSectionRef} className={`mt-6 p-4 rounded-xl transition-all duration-300 ${showSizeError ? 'bg-red-50 dark:bg-red-900/10 animate-shake ring-1 ring-red-500' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <label className={`text-sm font-bold flex items-center gap-2 ${showSizeError ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                    📏 Select Size
                                    {showSizeError && <AlertCircle className="w-4 h-4" />}
                                  </label>
                                  {showSizeError && (
                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {getSizes(product).map((size: string) => (
                                    <button
                                      key={size}
                                      onClick={() => {
                                        setInteractiveSelectedSize(size);
                                        setShowSizeError(false);
                                      }}
                                      className={`flex items-center justify-center py-2 px-4 rounded-lg border-2 font-medium text-sm transition-all duration-200 ${interactiveSelectedSize === size
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-2 ring-green-400'
                                        : showSizeError
                                          ? 'border-red-200 dark:border-red-900/30 text-gray-500 dark:text-gray-400 hover:border-red-300'
                                          : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Food Options */}
                          {isFoodBeverageProduct(product) && (
                            <div className="mt-8 space-y-6">
                              <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3 block">
                                  Spiciness Level
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                  {SPICINESS_LEVELS.map((level) => (
                                    <button
                                      key={level.value}
                                      onClick={() => setSelectedSpiciness(level.value)}
                                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${selectedSpiciness === level.value
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-500 ring-opacity-50 shadow-sm'
                                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                                        }`}
                                    >
                                      <span className="text-2xl mb-1">{level.label.split(' ')[0]}</span>
                                      <span className="text-xs font-medium text-center leading-tight dark:text-gray-300">
                                        {level.label.split(' ').slice(1).join(' ')}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label htmlFor="special-instructions" className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                                  Special Instructions
                                </label>
                                <textarea
                                  id="special-instructions"
                                  rows={3}
                                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white sm:text-sm p-3"
                                  placeholder="E.g. No onions, less sugar..."
                                  value={specialInstructions}
                                  onChange={(e) => setSpecialInstructions(e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          {/* Delivery Method */}
                          <div className="mt-8">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">Delivery Method</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div onClick={() => setDeliveryMethod('home')} className={`flex cursor-pointer items-center rounded-xl border p-4 transition-all duration-200 ${deliveryMethod === 'home' ? 'border-green-500 bg-green-50 dark:bg-green-900/10 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                                <div className={`p-2 rounded-full mr-3 ${deliveryMethod === 'home' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                  <HomeIcon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium dark:text-gray-200">Home Delivery</span>
                              </div>
                              <div onClick={() => setDeliveryMethod('pickup')} className={`flex cursor-pointer items-center rounded-xl border p-4 transition-all duration-200 ${deliveryMethod === 'pickup' ? 'border-green-500 bg-green-50 dark:bg-green-900/10 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                                <div className={`p-2 rounded-full mr-3 ${deliveryMethod === 'pickup' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                  <BriefcaseIcon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium dark:text-gray-200">Pick Up</span>
                              </div>
                            </div>
                            {deliveryMethod === 'home' && customer && customer.deliveryAddress && (
                              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                <span className="font-medium flex-shrink-0">Delivering to:</span>
                                <span>{customer.deliveryAddress.street}</span>
                              </div>
                            )}
                          </div>

                          {/* Payment Details */}
                          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-4">Payment Summary</h4>
                            <dl className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex justify-between">
                                <dt>Item price</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200">{formatPrice(product.price * quantity)}</dd>
                              </div>
                              {deliveryMethod === 'home' && (
                                <div className="flex justify-between">
                                  <dt>Home delivery</dt>
                                  <dd className="font-medium text-gray-900 dark:text-gray-200">TBD by vendor</dd>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                                <dt className="text-base font-bold text-gray-900 dark:text-white">Total</dt>
                                <dd className="text-xl font-bold text-green-600 dark:text-green-400">{formatPrice(total)}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      )}

                      {/* Page 3 content */}
                      {currentPage === paymentPageNum && isPaymentFlowEnabled && storeMeta && (
                        <div className="h-full">
                          <PaymentFlowPage
                            storeMeta={storeMeta}
                            onEvidenceUploaded={handleEvidenceUploaded}
                            onBack={handleBackToSummary}
                            uploadedEvidence={uploadedEvidence}
                            total={total}
                            customer={customer}
                            product={product}
                            quantity={quantity}
                            selectedSize={interactiveSelectedSize}
                            selectedColor={interactiveSelectedColor}
                            selectedSpiciness={selectedSpiciness}
                            specialInstructions={specialInstructions}
                            deliveryMethod={deliveryMethod}
                          />
                        </div>
                      )}

                      {currentPage === paymentPageNum && !isPaymentFlowEnabled && storeMeta && (
                        <div className="h-full">
                          <WhatsAppPreviewPage
                            message={whatsappMessage}
                            onConfirm={() => {
                              if (!storeMeta) return;
                              const encodedMessage = encodeURIComponent(whatsappMessage);
                              const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodedMessage}`;
                              window.open(whatsappUrl, '_blank');
                              setTimeout(() => onClose(), 500);
                            }}
                            onBack={handleBackToSummary}
                            isPlacingOrder={isPlacingOrder}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-modal-background p-4 sm:px-6">
                    <div className="max-w-3xl mx-auto w-full">
                      {currentPage === 1 && isElectronics ? (
                        <button
                          type="button"
                          className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 shadow-lg transition-all active:scale-[0.98]"
                          onClick={() => setCurrentPage(2)}
                        >
                          Next
                        </button>
                      ) : currentPage === summaryPageNum ? (
                        <div className="flex gap-3">
                          {isElectronics && (
                            <button
                              type="button"
                              className="w-1/3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
                              onClick={() => setCurrentPage(1)}
                            >
                              Back
                            </button>
                          )}
                          <button
                            type="button"
                            className={`${isElectronics ? 'w-2/3' : 'w-full'} rounded-xl border border-transparent px-6 py-4 text-base font-bold text-white shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                              ${hasSizes(product) && !interactiveSelectedSize
                                ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'}`}
                            onClick={() => {
                              if (hasSizes(product) && !interactiveSelectedSize) {
                                setShowSizeError(true);
                                sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Haptic feedback for error
                                if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                                return;
                              }
                              isPaymentFlowEnabled ? handleProceedToPayment() : handlePlaceOrder();
                            }}
                            disabled={isPlacingOrder || (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false)}
                          >
                            {isPlacingOrder ? (
                              <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Processing...</span>
                            ) : (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false) ? (
                              'Store Closed'
                            ) : hasSizes(product) && !interactiveSelectedSize ? (
                              'Select Size to Continue'
                            ) : (
                              'Order via Whatsapp'
                            )}
                          </button>
                        </div>
                      ) : currentPage === paymentPageNum && isPaymentFlowEnabled ? (
                        <div className="flex flex-col gap-3">
                          {/* Footer actions are now handled within PaymentFlowPage for better UX */}
                        </div>
                      ) : currentPage === paymentPageNum && !isPaymentFlowEnabled ? (
                        <button
                          type="button"
                          className="w-full bg-[#25D366] hover:bg-[#20bd5b] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                          onClick={() => {
                            if (!storeMeta) return;
                            const encodedMessage = encodeURIComponent(whatsappMessage);
                            const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodedMessage}`;
                            window.open(whatsappUrl, '_blank');
                            setTimeout(() => onClose(), 500);
                          }}
                          disabled={isPlacingOrder}
                        >
                          {isPlacingOrder ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <MessageSquare size={20} />
                              <span>Open WhatsApp</span>
                              <ExternalLink size={16} className="opacity-70" />
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Leave App Confirmation Dialog */}
      <Transition.Root show={showLeaveAppConfirmation} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={() => setShowLeaveAppConfirmation(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                        Switching Apps
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          You are about to leave the store to make your payment.
                          <br /><br />
                          <span className="font-bold text-gray-900 dark:text-white">Important:</span> Please keep this tab open. Once you've made the payment, come back here to upload your receipt and complete the order.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                      onClick={() => setShowLeaveAppConfirmation(false)}
                    >
                      Proceed to Pay
                    </button>
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowLeaveAppConfirmation(false)}
                    >
                      Stay Here
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
