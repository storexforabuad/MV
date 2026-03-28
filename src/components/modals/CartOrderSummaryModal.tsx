'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HomeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { CartItem, useCart } from '@/lib/cartContext';
import { StoreMeta } from '@/types/store';
import { Customer } from '@/types/customer';
import { formatPrice } from '@/utils/price';
import { useOrders } from '@/hooks/useOrders';
import { Loader2, MessageSquare, ExternalLink, AlertCircle, Activity, Palette, Layers, Ruler, PenTool, CheckCircle2, ShieldCheck, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCustomerDetails } from '@/app/actions/customerActions';
import { useCustomer } from '@/context/CustomerContext';
import { shouldUsePaymentFlow } from '@/utils/storeHelpers';
import { isFashionProduct, isElectronicsProduct, isSolarProduct, isVehicleProduct, isBeautyProduct, isArtProduct } from '@/utils/productHelpers';
import { saveModalState, getModalState, clearModalState } from '@/lib/paymentModalStorage';
import { requestCustomerNotificationPermission } from '@/lib/requestCustomerNotifications';
import PaymentFlowPage from './PaymentFlowPage';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import { shouldShowWhatsAppPreview } from '@/utils/storeHelpers';
import WhatsAppPreviewPage from './WhatsAppPreviewPage';

interface CartOrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
  cartItems: CartItem[];
  storeMeta: StoreMeta | null;
  customer: Customer | null;
  storeId?: string;
  isReorder?: boolean;
}

export default function CartOrderSummaryModal({ isOpen, onClose, onOrderSuccess, cartItems, storeMeta, customer: initialCustomer, storeId: passedStoreId, isReorder = false }: CartOrderSummaryModalProps) {
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState('home');
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [uploadedEvidence, setUploadedEvidence] = useState<{ url: string; fileName: string } | undefined>();
  const [showLeaveAppConfirmation, setShowLeaveAppConfirmation] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  const hasPushedState = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<Record<string, HTMLDivElement | null>>({});

  const storeId = passedStoreId || cartItems[0]?.storeId;
  const { addOrder } = useOrders(customer?.id || null, storeId || "");
  const { dispatch } = useCart();
  const { promptLogin } = useCustomer();

  const isPaymentFlowEnabled = shouldUsePaymentFlow(storeMeta);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal;

  const hasArt = cartItems.some(item => isArtProduct(item as any));
  const hasBeauty = cartItems.some(item => isBeautyProduct(item as any));
  const hasMediaInfluencer = cartItems.some(item => item.productType === 'media-influencer');
  const summaryPageNum = (hasBeauty || hasMediaInfluencer || hasArt) ? 2 : 1;
  const paymentPageNum = (hasBeauty || hasMediaInfluencer || hasArt) ? 3 : 2;

  const hasVehicle = cartItems.some(item => isVehicleProduct(item as any));
  const allVehicles = cartItems.length > 0 && cartItems.every(item => isVehicleProduct(item as any));
  const hasService = cartItems.some(item => item.productType === 'media-influencer' && (item as any).subtype === 'service');
  const allServices = cartItems.length > 0 && cartItems.every(item => item.productType === 'media-influencer' && (item as any).subtype === 'service');

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setDeliveryMethod('home');
      setOrderNotes('');
      setUploadedEvidence(undefined);
      setShowLeaveAppConfirmation(false);
      setHasPlacedOrder(false);
      setShowSizeError(false);
      setImageLoading({});

      if (isPaymentFlowEnabled && storeId) {
        const savedState = getModalState(storeId);
        if (savedState) {
          setCurrentPage(savedState.currentPage === 3 ? 1 : savedState.currentPage);
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

    // Push state to handle back button only once and only if the modal is actually open
    if (isOpen && !hasPushedState.current) {
      window.history.pushState({ modal: 'cart-order-summary' }, '');
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
        if (window.history.state?.modal === 'cart-order-summary') {
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

  // Reset hasPlacedOrder if any order details change
  useEffect(() => {
    setHasPlacedOrder(false);
  }, [deliveryMethod, orderNotes, cartItems]);

  const handleEvidenceUploaded = (evidenceUrl: string, fileName: string) => {
    setUploadedEvidence({ url: evidenceUrl, fileName });
    if (storeId) {
      saveModalState(storeId, 2, evidenceUrl, fileName);
    }
  };

  const handlePlaceOrder = async () => {
    if (!storeMeta || !storeId) return;

    if (isPaymentFlowEnabled && !customer) {
      toast.error('Please log in or verify identity to use the secure payment flow');
      const hasService = cartItems.some(i => i.productType === 'media-influencer' && (i as any).subtype === 'service');
      promptLogin({
        storeType: storeMeta.storeType,
        itemType: hasService ? 'service' : 'product'
      });
      return;
    }

    if (isPaymentFlowEnabled && !uploadedEvidence) {
      toast.error('Please upload payment evidence first');
      return;
    }

    if (hasPlacedOrder && !isPaymentFlowEnabled) {
      setCurrentPage(2);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const storeMetaWithId = { ...storeMeta, id: storeId };
      const referrerId = localStorage.getItem('referrerId');

      if (isPaymentFlowEnabled) {
        if (!customer) throw new Error("Customer session not found");
        await addOrder(
          cartItems,
          storeMetaWithId,
          customer,
          referrerId,
          false,
          deliveryMethod as 'home' | 'pickup',
          orderNotes,
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
        dispatch({ type: 'CLEAR_CART' });
        onOrderSuccess();
        onClose();
      } else {
        const guestInfo = (customer || {
          id: 'guest',
          name: 'Guest Customer',
          phoneNumber: '',
          deliveryAddress: { street: '', state: '', country: '' }
        }) as Customer;

        await addOrder(cartItems, storeMetaWithId, guestInfo, referrerId, false, deliveryMethod as 'home' | 'pickup', orderNotes);

        if (customer?.id) {
          requestCustomerNotificationPermission(customer.id).catch(err =>
            console.error('Failed to request notification permission:', err)
          );
        }

        // toast.success('Order placed! Redirecting to WhatsApp...');

        const itemsSummary = cartItems.map(item => {
          const productUrl = `https://tinyurl.com/bizconnet/${storeId}/products/${item.id}${item.selectedColor ? `?v=${encodeURIComponent(item.selectedColor)}` : ''}`;
          const colorLabel = isFashionProduct(item as any) && (item as any).isTextile ? 'Design' : 'Color';
          const colorText = item.selectedColor ? `🎨 *${colorLabel}:* ${item.selectedColor}\n` : '';
          const sizeText = item.selectedSize ? `📏 *Size:* ${item.selectedSize}\n` : '';
          const unitText = item.productType === 'livestock'
            ? ((item as any).priceUnit === 'kg' ? 'kg' : 'pcs')
            : (isFashionProduct(item as any) && (item as any).isTextile ? (item.quantity > 1 ? 'Yards' : 'Yard') : '');

          return `*${item.name.trim()}*\n` +
            `🔗 ${productUrl}\n` +
            colorText +
            sizeText +
            `🔢 *Quantity:* ${item.quantity} ${unitText}\n` +
            (isSolarProduct(item as any) ? (
              ((item as any).subtype === 'solar-panels' ? `☀️ *Panel Specs:* ${(item as any).wattage}${(item as any).cellType ? ` (${(item as any).cellType})` : ''}${(item as any).efficiencyRating ? `, Efficiency: ${(item as any).efficiencyRating}` : ''}\n` : '') +
              ((item as any).subtype === 'inverters' ? `🔄 *Inverter Specs:* ${(item as any).powerCapacity}${(item as any).inverterType ? ` (${(item as any).inverterType})` : ''}${(item as any).systemVoltage ? `, System: ${(item as any).systemVoltage}` : ''}\n` : '') +
              ((item as any).subtype === 'batteries' ? `🔋 *Battery:* ${(item as any).batteryCapacity}${(item as any).batteryChemistry ? ` (${(item as any).batteryChemistry})` : ''}${(item as any).lifeCycles ? `, cycles: ${(item as any).lifeCycles}` : ''}\n` : '') +
              ((item as any).subtype === 'charge-controllers' ? `🎛️ *Controller:* ${(item as any).maxCurrentRating}${(item as any).controllerType ? ` (${(item as any).controllerType})` : ''}\n` : '') +
              ((item as any).subtype === 'dc-appliances' || (item as any).subtype === 'ac-appliances' ? `⚡ *Power:* ${(item as any).powerConsumption}${(item as any).energyStarRating ? ` (${(item as any).energyStarRating})` : ''}\n` : '') +
              ((item as any).subtype === 'solar-kits' ? `📦 *Kit Capacity:* ${(item as any).totalSystemCapacity}${(item as any).estimatedDailyYield ? ` (Yield: ${(item as any).estimatedDailyYield})` : ''}\n` : '')
            ) : '') +
            (isVehicleProduct(item as any) ? (
              (((item as any).vehicleDetails?.make || (item as any).vehicleDetails?.model) ? `🚗 *Make/Model:* ${(item as any).vehicleDetails.make || ''} ${(item as any).vehicleDetails.model || ''}\n` : '') +
              ((item as any).vehicleDetails?.year ? `📅 *Year:* ${(item as any).vehicleDetails.year}\n` : '') +
              ((item as any).vehicleDetails?.mileage !== undefined ? `🛣️ *Mileage:* ${(item as any).vehicleDetails.mileage.toLocaleString()} km\n` : '')
            ) : '') +
            (isArtProduct(item as any) && (item as any).artDetails ? (
              `🎨 *Medium:* ${(item as any).artDetails.medium}\n` +
              `🖼️ *Surface:* ${(item as any).artDetails.surface}\n` +
              `📏 *Dimensions:* ${(item as any).artDetails.dimensions}\n` +
              `📅 *Year:* ${(item as any).artDetails.year}\n` +
              `✨ *Edition:* ${(item as any).artDetails.edition}\n` +
              ((item as any).artDetails.isSigned ? `✍️ *Signed by Artist*\n` : '') +
              ((item as any).artDetails.hasCertificate ? `📜 *COA Included*\n` : '')
            ) : '') +
            `*Subtotal:* ${formatPrice(item.price * item.quantity)}`;
        }).join('\n\n');

        const message = `🛍️ *${isReorder ? 'Reorder Request' : allVehicles ? 'New Vehicles Enquiry' : 'New Cart Order'}*\n\n` +
          `Hello! I would like to ${isReorder ? 'reorder' : 'enquire about/order'} the following items:\n\n` +
          `${itemsSummary}\n\n` +
          `--------------------\n` +
          (!allVehicles ? `🚚 *Delivery Method:* ${deliveryMethod === 'home' ? 'Home Delivery' : 'Pick Up'}\n` : '') +
          (!allVehicles && deliveryMethod === 'home' ? (customer?.deliveryAddress?.street ? `📍 *Address:* ${customer.deliveryAddress.street}\n` : '📍 *Address:* (Please provide your address below)\n') : '') +
          (orderNotes ? `📝 *Special Instructions:* ${orderNotes}\n` : '') +
          `*Grand Total${!allVehicles ? ' (excl. delivery)' : ''}:* ${formatPrice(total)}\n\n` +
          `Please confirm availability and provide ${!allVehicles ? 'payment/delivery' : 'more'} details.\n\n` +
          `Thank you! 🙏`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodedMessage}`;

        if (shouldShowWhatsAppPreview(storeMeta.storeType)) {
          setWhatsappMessage(message);
          setHasPlacedOrder(true);
          setCurrentPage(2);
        } else {
          window.open(whatsappUrl, '_blank');
          // Small delay to ensure the redirect is triggered before closing/clearing
          setTimeout(() => {
            dispatch({ type: 'CLEAR_CART' });
            onOrderSuccess();
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error placing cart order:", error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleBackToSummary = () => {
    setCurrentPage(1);
    if (storeId) {
      saveModalState(storeId, 1, uploadedEvidence?.url, uploadedEvidence?.fileName);
    }
  };

  const handleProceedToPayment = () => {
    setCurrentPage(2);
    if (storeId) {
      saveModalState(storeId, 2, uploadedEvidence?.url, uploadedEvidence?.fileName);
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
                      {currentPage === 1 && hasBeauty ? 'Beauty Guide & Directions' :
                        currentPage === 1 && hasMediaInfluencer ? 'Influencer Collaboration Guide' :
                          currentPage === summaryPageNum ? 'Cart Summary' :
                            (isPaymentFlowEnabled ? 'Payment' : 'WhatsApp Preview')}
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
                      {/* Page 1: Beauty Guide */}
                      {currentPage === 1 && hasBeauty && (
                        <div className="pt-2 sm:pt-4 space-y-8 pb-10">
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <Activity size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Beauty Masterclass Guide</h4>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Professional application steps for your selected beauty items.</p>
                            </div>
                          </div>

                          <div className="space-y-8">
                            {cartItems.filter(item => isBeautyProduct(item as any)).map((item: any, idx) => (
                              <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                  <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">{item.name}</h5>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  {(item.howToUse || item.instructions) && (
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">How to Use</span>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic whitespace-pre-line">"{item.howToUse || item.instructions}"</p>
                                    </div>
                                  )}
                                  {item.benefits && (
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-1 block">Science & Benefits</span>
                                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">{item.benefits}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Page 1: Media Influencer Guide */}
                      {currentPage === 1 && hasMediaInfluencer && (
                        <div className="pt-2 sm:pt-4 space-y-8 pb-10">
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <ShieldCheck size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Influencer Collaboration Prep</h4>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Important details for your upcoming collaboration(s).</p>
                            </div>
                          </div>

                          <div className="space-y-8">
                            {cartItems.filter(item => item.productType === 'media-influencer').map((item: any, idx) => (
                              <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                  <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">{item.name}</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {item.platform && (
                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 block">Platform</span>
                                      <p className="text-xs font-bold text-gray-900 dark:text-white">{item.platform}</p>
                                    </div>
                                  )}
                                  {item.deliveryTimeDays !== undefined && (
                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 block">Timeline</span>
                                      <p className="text-xs font-bold text-gray-900 dark:text-white">{item.deliveryTimeDays} Days</p>
                                    </div>
                                  )}
                                </div>
                                {item.description && (
                                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">Guidelines</span>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic whitespace-pre-line lowercase first-letter:uppercase">
                                      {item.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold text-center">
                              🛡️ Payments are protected via Escrow for all influencer services.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Page 1: Art Collection Passport */}
                      {currentPage === 1 && hasArt && (
                        <div className="pt-2 sm:pt-4 space-y-8 pb-10">
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-amber-600 dark:text-amber-400">
                              <Palette size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Art Collection Passport</h4>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Provenance and technical details for your selected artworks.</p>
                            </div>
                          </div>

                          <div className="space-y-10">
                            {cartItems.filter(item => isArtProduct(item as any)).map((item: any, idx) => (
                              <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <Image
                                      src={item.selectedImage || item.images?.[0] || '/default_product_800x800.png'}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).src = '/default_product_800x800.png'; }}
                                    />
                                  </div>
                                  <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">{item.name}</h5>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                      <Palette size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest block">Medium</span>
                                      <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{item.artDetails?.medium || 'Original'}</p>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                      <Layers size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest block">Surface</span>
                                      <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{item.artDetails?.surface || 'Canvas'}</p>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                      <PenTool size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest block">Edition</span>
                                      <p className="text-[11px] font-bold text-gray-900 dark:text-white capitalize truncate">{item.artDetails?.edition || 'Original'}</p>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                      <Ruler size={14} />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest block">Size</span>
                                      <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{item.artDetails?.dimensions || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {item.artDetails?.isSigned && (
                                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1.5">
                                      <CheckCircle2 size={10} className="text-emerald-500" />
                                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Hand Signed</span>
                                    </div>
                                  )}
                                  {item.artDetails?.hasCertificate && (
                                    <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex items-center gap-1.5">
                                      <ShieldCheck size={10} className="text-blue-500" />
                                      <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">COA</span>
                                    </div>
                                  )}
                                  {item.artDetails?.year && (
                                    <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 flex items-center gap-1.5">
                                      <Calendar size={10} className="text-gray-500 dark:text-gray-400" />
                                      <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">{item.artDetails.year}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary Page */}
                      {currentPage === summaryPageNum && (
                        <div className="pt-4 sm:pt-8">
                          <div className="space-y-4">
                            {cartItems.map(item => {
                              const hasSizes = (item as any).sizes?.length > 0 || (item as any).sizeOption?.length > 0;
                              const isMissingSize = hasSizes && !item.selectedSize;
                              const itemId = item.id + (item.selectedColor || '') + (item.selectedSize || '');

                              let displayImage = (item as any).selectedImage || item.images?.[0] || '/default_product_800x800.png';
                              if (!(item as any).selectedImage && (item as any).colors && item.selectedColor) {
                                const colorObj = (item as any).colors.find((c: any) => c.name === item.selectedColor || c.hex === item.selectedColor);
                                if (colorObj?.images?.length > 0) {
                                  displayImage = colorObj.images[0];
                                }
                              }

                              return (
                                <div
                                  key={itemId}
                                  ref={el => { sizeSectionRef.current[itemId] = el; }}
                                  className={`flex items-center space-x-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border transition-all duration-300 ${isMissingSize && showSizeError ? 'border-red-500 bg-red-50 dark:bg-red-900/10 animate-shake ring-1 ring-red-500' : 'border-gray-100 dark:border-gray-800'}`}
                                >
                                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 shadow-inner">
                                    <div className={`absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-shimmer bg-[length:200%_100%] transition-opacity duration-300 ${imageLoading[itemId] !== false ? 'opacity-100' : 'opacity-0'}`} />
                                    <Image
                                      src={displayImage}
                                      alt={item.name}
                                      width={64}
                                      height={64}
                                      className={`h-16 w-16 object-cover relative z-10 transition-opacity duration-300 ${imageLoading[itemId] !== false ? 'opacity-0' : 'opacity-100'}`}
                                      onLoad={() => setImageLoading(prev => ({ ...prev, [itemId]: false }))}
                                      onError={(e) => { (e.target as HTMLImageElement).src = '/default_product_800x800.png'; setImageLoading(prev => ({ ...prev, [itemId]: false })); }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                                      {isMissingSize && showSizeError && (
                                        <span className="flex-shrink-0 text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-100 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                                          <AlertCircle className="w-3 h-3" /> REQUIRED
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                      {item.selectedColor && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                          {isBeautyProduct(item as any) ? 'Shade' : (item as any).isTextile ? 'Design' : 'Color'}: {item.selectedColor}
                                        </span>
                                      )}
                                      {isElectronicsProduct(item as any) && (item as any).condition && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${(item as any).condition === 'brand-new'
                                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800'
                                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                                          }`}>
                                          {(item as any).condition === 'brand-new' ? 'Brand New' : (item as any).condition.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                        </span>
                                      )}
                                      {isSolarProduct(item as any) && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                                          {(() => {
                                            const s = item as any;
                                            switch (s.subtype) {
                                              case 'panel': return `☀️ ${s.wattage}`;
                                              case 'inverter': return `🔄 ${s.inverterCapacity}`;
                                              case 'battery': return `🔋 ${s.batteryCapacity}`;
                                              case 'controller': return `🎛️ ${s.controllerAmperage}`;
                                              case 'appliance': return `⚡ ${s.powerRating}`;
                                              default: return 'Solar Product';
                                            }
                                          })()}
                                        </span>
                                      )}
                                      {item.selectedSize && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800">
                                          {isBeautyProduct(item as any) ? 'Volume' : 'Size'}: {item.selectedSize}
                                        </span>
                                      )}
                                    </div>

                                    {/* Interactive Color Selector for Cart Items */}
                                    {((item as any).colors) && (item as any).colors.length > 0 && !(item as any).isTextile && (
                                      <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2.5 border-t border-gray-100 dark:border-gray-800/50">
                                        {((item as any).colors).map((color: any) => (
                                          <button
                                            key={color.name}
                                            onClick={() => {
                                              dispatch({
                                                type: 'UPDATE_COLOR',
                                                payload: {
                                                  id: item.id,
                                                  oldColor: item.selectedColor,
                                                  newColor: color.name,
                                                  selectedSize: item.selectedSize
                                                }
                                              });
                                            }}
                                            className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold transition-all duration-200 ${item.selectedColor === color.name
                                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-400'
                                              : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                              }`}
                                          >
                                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm" style={{ backgroundColor: color.hex }} />
                                            {color.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {/* Interactive Size Selector for Cart Items */}
                                    {((item as any).sizes || (item as any).sizeOption) && (
                                      <div className={`mt-2.5 flex flex-wrap gap-1.5 pt-2.5 border-t ${isMissingSize && showSizeError ? 'border-red-200 dark:border-red-800/50' : 'border-gray-100 dark:border-gray-800/50'}`}>
                                        {((item as any).sizes || (item as any).sizeOption).map((size: string) => (
                                          <button
                                            key={size}
                                            onClick={() => {
                                              dispatch({
                                                type: 'UPDATE_SIZE',
                                                payload: {
                                                  id: item.id,
                                                  oldSize: item.selectedSize,
                                                  newSize: size,
                                                  selectedColor: item.selectedColor
                                                }
                                              });
                                              if (isMissingSize) setShowSizeError(false);
                                            }}
                                            className={`flex items-center justify-center min-w-[32px] px-2 py-1 rounded-md border text-[10px] font-bold transition-all duration-200 ${item.selectedSize === size
                                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-400'
                                              : isMissingSize && showSizeError
                                                ? 'border-red-200 dark:border-red-900/30 text-gray-500 dark:text-gray-400 hover:border-red-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                              }`}
                                          >
                                            {size}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    <div className="mt-1.5 flex items-center justify-between">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatPrice(item.price)} x {item.quantity}{(item as any).isTextile ? (item.quantity > 1 ? ' Yards' : ' Yard') : ''}
                                      </p>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Order Notes */}
                          <div className="mt-8">
                            <label htmlFor="order-notes" className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2 block">
                              Special Instructions (Optional)
                            </label>
                            <textarea
                              id="order-notes"
                              rows={3}
                              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white sm:text-sm p-3"
                              placeholder="Any special requests for this order?"
                              value={orderNotes}
                              onChange={(e) => setOrderNotes(e.target.value)}
                            />
                          </div>

                          {/* Delivery Method */}
                          {!hasVehicle && (
                            <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
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
                                  <span>{customer.name} - {customer.deliveryAddress.street}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
                            <dl className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-medium text-gray-900 dark:text-gray-200">{formatPrice(subtotal)}</dd></div>
                              {deliveryMethod === 'home' && !hasVehicle && (
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

                      {/* Page 2: Payment Flow */}
                      {currentPage === 2 && isPaymentFlowEnabled && storeMeta && (
                        <div className="h-full">
                          <PaymentFlowPage
                            storeMeta={storeMeta}
                            onEvidenceUploaded={handleEvidenceUploaded}
                            onBack={handleBackToSummary}
                            uploadedEvidence={uploadedEvidence}
                            total={total}
                            customer={customer}
                            cartItems={cartItems}
                            deliveryMethod={deliveryMethod}
                            orderNotes={orderNotes}
                          />
                        </div>
                      )}

                      {currentPage === 2 && !isPaymentFlowEnabled && storeMeta && (
                        <div className="h-full">
                          <WhatsAppPreviewPage
                            message={whatsappMessage}
                            onConfirm={() => {
                              const encodedMessage = encodeURIComponent(whatsappMessage);
                              const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}?text=${encodedMessage}`;
                              window.open(whatsappUrl, '_blank');
                              setTimeout(() => {
                                dispatch({ type: 'CLEAR_CART' });
                                onOrderSuccess();
                                onClose();
                              }, 500);
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
                      {currentPage === 1 && (hasBeauty || hasMediaInfluencer || hasArt) ? (
                        <button
                          type="button"
                          className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 shadow-lg transition-all active:scale-[0.98]"
                          onClick={() => setCurrentPage(2)}
                        >
                          Review Order Summary
                        </button>
                      ) : currentPage === summaryPageNum ? (
                        <div className="flex gap-3">
                          {(hasBeauty || hasMediaInfluencer || hasArt) && (
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
                            className={`${(hasBeauty || hasMediaInfluencer || hasArt) ? 'w-2/3' : 'w-full'} rounded-xl border border-transparent px-6 py-4 text-base font-bold text-white shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                              ${cartItems.some(item => ((item as any).sizes?.length > 0 || (item as any).sizeOption?.length > 0) && !item.selectedSize)
                                ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'}`}
                            onClick={() => {
                              const itemMissingSize = cartItems.find(item => ((item as any).sizes?.length > 0 || (item as any).sizeOption?.length > 0) && !item.selectedSize);
                              if (itemMissingSize) {
                                setShowSizeError(true);
                                const itemId = itemMissingSize.id + (itemMissingSize.selectedColor || '') + (itemMissingSize.selectedSize || '');
                                sizeSectionRef.current[itemId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Haptic feedback for error
                                if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                                return;
                              }
                              isPaymentFlowEnabled ? handleProceedToPayment() : handlePlaceOrder();
                            }}
                            disabled={isPlacingOrder || !storeId || (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false)}
                          >
                            {isPlacingOrder ? (
                              <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Processing...</span>
                            ) : (storeMeta?.storeType === 'restaurant' && storeMeta?.isOpen === false) ? (
                              'Store Closed'
                            ) : cartItems.some(item => ((item as any).sizes?.length > 0 || (item as any).sizeOption?.length > 0) && !item.selectedSize) ? (
                              'Select Sizes to Continue'
                            ) : (
                              allVehicles ? 'Enquire about Vehicles' :
                                hasMediaInfluencer ? (allServices ? 'Book via WhatsApp' : hasService ? 'Book & Order via WhatsApp' : 'Order via WhatsApp') :
                                  hasVehicle ? 'Enquire & Order via WhatsApp' : (isPaymentFlowEnabled ? 'Proceed to Payment' : 'Order via WhatsApp')
                            )}
                          </button>
                        </div>
                      ) : currentPage === paymentPageNum && isPaymentFlowEnabled ? (
                        <div className="flex flex-col gap-3">
                          {uploadedEvidence ? (
                            <button
                              type="button"
                              className="w-full rounded-xl border border-transparent bg-green-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              onClick={handlePlaceOrder}
                              disabled={isPlacingOrder}
                            >
                              {isPlacingOrder ? (
                                <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Placing Order...</span>
                              ) : (
                                'Complete Order'
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-xl border border-transparent bg-gray-900 dark:bg-white px-6 py-4 text-base font-bold text-white dark:text-gray-900 shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all transform active:scale-[0.98]"
                              onClick={() => setShowLeaveAppConfirmation(true)}
                            >
                              Leave App to Pay
                            </button>
                          )}
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
                            setTimeout(() => {
                              dispatch({ type: 'CLEAR_CART' });
                              onOrderSuccess();
                              onClose();
                            }, 500);
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
