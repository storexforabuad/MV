'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, MapPin, CheckCircle, Phone, MessageCircle, User, Package } from 'lucide-react';
import { StoreOrder, updateOrderStatus } from '@/app/actions/orderActions';
import { formatPrice } from '@/utils/price';
import { Naira } from '@/components/common/Naira';
import toast from 'react-hot-toast';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import PaymentEvidenceViewer from './PaymentEvidenceViewer';
import { MarkOrderReadyModal } from './MarkOrderReadyModal';
import EscrowDeliverablePanel from '@/components/admin/EscrowDeliverablePanel';

interface AdminOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: StoreOrder[];
  onOrderUpdated: () => void;
  storeId: string;
  highlightOrderId?: string | null;
}

const MOCK_ORDERS: any[] = [
  {
    id: "mock-service-001",
    customerInfo: {
      id: "cust-1",
      name: "Amara Okeke",
      phoneNumber: "08012345678",
      deliveryAddress: { street: "No. 42 Crescent Drive, Victoria Island", state: "Lagos", country: "Nigeria" }
    },
    products: [
      {
        id: "serv-high-tier",
        name: "Premium Brand Ambassadorship",
        price: 250000,
        quantity: 1,
        productType: 'media-influencer',
        subtype: 'service',
        brandName: "Standard Chartered Bank",
        campaignBrief: "Launch of the new 'Digital First' banking app. Require 1 main feed video explaining the benefits, 3 stories with swipe-up links, and a link-in-bio for 2 weeks."
      }
    ],
    orderDate: new Date().toISOString(),
    orderStatus: 'processing',
    paymentStatus: 'escrow-held'
  },
  {
    id: "mock-product-002",
    customerInfo: {
      id: "cust-2",
      name: "Musa Ibrahim",
      phoneNumber: "09055544433",
      deliveryAddress: { street: "Wunti Market Road", state: "Bauchi", country: "Nigeria" }
    },
    products: [
      {
        id: "candle-mock-1",
        name: "Midnight Jasmine Scented Candle",
        price: 12500,
        quantity: 2,
        productType: 'beauty',
        subtype: 'candle',
        scent: "Midnight Jasmine",
        burnTime: "45 Hours",
        waxType: "Natural Soy Wax"
      }
    ],
    orderDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    orderStatus: 'ready',
    paymentStatus: 'escrow-held'
  },
  {
    id: "mock-solar-003",
    customerInfo: {
      id: "cust-3",
      name: "Olawale Johnson",
      phoneNumber: "07022334455",
      deliveryAddress: { street: "Garki Area 11", state: "Abuja", country: "Nigeria" }
    },
    products: [
      {
        id: "solar-mock-1",
        name: "5KVA Hybrid Solar Inverter System",
        price: 850000,
        quantity: 1,
        productType: 'solar',
        subtype: 'inverters',
        powerCapacity: "5KVA / 4000W",
        systemVoltage: "48V DC",
        inverterType: "Pure Sine Wave"
      }
    ],
    orderDate: new Date(Date.now() - 86400000).toISOString(),
    orderStatus: 'shipped',
    paymentStatus: 'escrow-released'
  }
];

const OrderProductRow = ({ product }: { product: any }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Package className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {product.quantity}</p>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white">
        <Naira />{product.price.toLocaleString()}
      </p>
    </div>
  );
};

const CustomerOrdersCard = ({ order, onMarkReady, isHighlighted, storeId, onUpdate }: { order: StoreOrder, onMarkReady: (order: StoreOrder) => void, isHighlighted?: boolean, storeId: string, onUpdate: () => void }) => {
  const { customerInfo, products } = order;
  const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(customerInfo.phoneNumber)}`;
  const isServiceOrder = products.some((p: any) => p.productType === 'media-influencer' && (p.subtype === 'service' || p.subtype === 'event-ticket-promo' || p.subtype === 'service-hub'));
  const eventTicketProduct = products.find((p: any) => p.productType === 'media-influencer' && p.subtype === 'event-ticket-promo');

  // Find if there are any dropshipped items in this order
  const dropshippedItems = products.filter((p: any) => p.isDropshipped && p.supplierId);
  const hasDropshippedItems = dropshippedItems.length > 0;

  // Calculate the total wholesale cost owed to suppliers for this order
  const totalWholesaleCost = dropshippedItems.reduce((sum: number, item: any) => {
    return sum + (item.wholesaleCost || 0) * (item.quantity || 1);
  }, 0);

  // Build the WhatsApp forwarding message for the supplier
  // Note: in a multi-supplier scenario, we'd group by supplier. But for MVP, we just combine.
  const buildSupplierMessage = () => {
    const itemsList = dropshippedItems.map((item: any) => `- ${item.quantity}x ${item.name} (Source ID: ${item.sourceProductId})`).join('%0A');
    const note = `Hello! I received an order for your dropshipped items:%0A%0A${itemsList}%0A%0ATotal Cost (My Cost): ₦${totalWholesaleCost.toLocaleString()}%0A%0A*Shipping Details:*%0A${customerInfo.name}%0A${customerInfo.phoneNumber}%0A${customerInfo.deliveryAddress.street}, ${customerInfo.deliveryAddress.state}%0A%0APlease let me know how to send you the ₦${totalWholesaleCost.toLocaleString()} so you can fulfill this order!`;
    return note;
  };

  return (
    <motion.div
      id={`order-${order.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white dark:bg-slate-900 rounded-[2rem] border-2 ${isHighlighted ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-slate-100 dark:border-slate-800'} overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300`}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
              <User className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{customerInfo.name}</h4>
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">Order #{order.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`tel:${customerInfo.phoneNumber}`}
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95 translate-y-[2px]"
            >
              <Phone className="w-4 h-4" />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 translate-y-[2px]"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
            <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
              {customerInfo.deliveryAddress.street}, {customerInfo.deliveryAddress.state}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/50 px-5 py-2">
        {products.map((product: any, index: number) => (
          <OrderProductRow key={product.id || index} product={product} />
        ))}
      </div>

      {hasDropshippedItems && (
        <div className="px-5 py-3 bg-purple-50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1">Dropship Fulfillment</p>
              <p className="text-[13px] text-slate-600 dark:text-slate-400">
                You owe the supplier <span className="font-bold text-slate-900 dark:text-white">₦{totalWholesaleCost.toLocaleString()}</span>
              </p>
            </div>
            <a
              href={`https://wa.me/?text=${buildSupplierMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Forward
            </a>
          </div>
        </div>
      )}

      {order.paymentEvidenceUrl && (
        <PaymentEvidenceViewer
          paymentEvidenceUrl={order.paymentEvidenceUrl}
          paymentEvidenceFileName={order.paymentEvidenceFileName}
          paymentEvidenceUploadedAt={order.paymentEvidenceUploadedAt}
          paymentStatus={order.paymentStatus}
        />
      )}

      {/* Escrow Deliverable Panel — only for Media Influencer Service orders */}
      {isServiceOrder && (
        <div className="px-5 pb-4 space-y-4">
          {/* Display Service specifics if available */}
          {products.map((p: any) => p.productType === 'media-influencer' && (p.brandName || p.campaignBrief || p.eventPayload) && (
            <div key={p.id} className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Package className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{p.subtype === 'event-ticket-promo' ? 'Ticket Promo Request' : 'Service Requirements'}</span>
              </div>
              {p.brandName && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight text-indigo-400 dark:text-indigo-500">Brand Name</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.brandName}</p>
                </div>
              )}
              {p.campaignBrief && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight text-indigo-400 dark:text-indigo-500">Campaign Brief</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg border border-indigo-100/30 dark:border-indigo-800/20">{p.campaignBrief}</p>
                </div>
              )}
              {p.eventPayload && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-800/30">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-indigo-400 dark:text-indigo-500">Event Info</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.eventPayload.eventName}</p>
                    <p className="text-[11px] text-slate-500">{p.eventPayload.date} • {p.eventPayload.time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-indigo-400 dark:text-indigo-500">Venue</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.eventPayload.venue}</p>
                  </div>
                  <div className="col-span-2 pt-1">
                    <p className="text-[10px] font-black uppercase tracking-tight text-indigo-400 dark:text-indigo-500">Ticket Tiers Configuration</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {p.eventPayload.tiers?.map((t: any) => (
                        <span key={t.id} className="text-[10px] px-2 py-1 bg-white/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-indigo-800 rounded-lg font-bold text-indigo-700 dark:text-indigo-300">
                          {t.name}: ₦{(t.price || 0).toLocaleString()} ({t.quantityAvailable} qty)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <EscrowDeliverablePanel
            orderId={order.id}
            storeId={storeId}
            isInfluencerView={true}
            paymentStatus={order.paymentStatus}
            orderStatus={order.orderStatus}
            deliverableUrl={(order as any).deliverableUrl}
            onUpdate={onUpdate}
            isEventTicketPromo={!!eventTicketProduct}
            eventPayload={(eventTicketProduct as any)?.eventPayload}
            commissionCut={(eventTicketProduct as any)?.commissionCut}
          />
        </div>
      )}

      {!isServiceOrder && (
        <button
          onClick={() => onMarkReady(order)}
          disabled={order.orderStatus === 'ready'}
          className={`w-full flex items-center justify-center gap-2 py-5 text-sm font-black uppercase tracking-widest text-white transition-all rounded-b-[2rem] rounded-t-none mt-4 ${order.orderStatus === 'ready'
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-lg shadow-green-500/20'
            }`}
        >
          <CheckCircle className="w-5 h-5" />
          <span>{order.orderStatus === 'ready' ? 'Ready for Delivery' : 'Mark as Ready'}</span>
        </button>
      )}
    </motion.div>
  );
};

const groupOrdersByDay = (orders: StoreOrder[]) => {
  const groups: { [day: string]: StoreOrder[] } = {};
  orders.forEach(order => {
    const orderDate = new Date(order.orderDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let dayKey: string;
    if (orderDate.toDateString() === today.toDateString()) dayKey = 'Today';
    else if (orderDate.toDateString() === yesterday.toDateString()) dayKey = 'Yesterday';
    else dayKey = orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(order);
  });
  return groups;
};

export const AdminOrdersModal = ({ isOpen, onClose, orders, onOrderUpdated, storeId, highlightOrderId }: AdminOrdersModalProps) => {
  const [isPending, startTransition] = useTransition();
  const [selectedOrderForReadiness, setSelectedOrderForReadiness] = useState<StoreOrder | null>(null);

  // Merge real orders with mock orders for comprehensive visualization
  const displayOrders = [...orders, ...MOCK_ORDERS];
  const groupedOrders = groupOrdersByDay(displayOrders);
  const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

  // Auto-scroll to highlighted order
  useEffect(() => {
    if (highlightOrderId && isOpen) {
      setTimeout(() => {
        const element = document.getElementById(`order-${highlightOrderId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // Delay for modal animation
    }
  }, [highlightOrderId, isOpen]);

  const handleMarkReady = (order: StoreOrder) => {
    setSelectedOrderForReadiness(order);
  }

  const handleConfirmMarkReady = (order: StoreOrder, productIds: string[]) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(storeId, order.id, productIds);
        toast.success('Order status updated!');
        onOrderUpdated();
        setSelectedOrderForReadiness(null);
      } catch (error) {
        toast.error('Failed to update order status.');
        console.error(error);
      }
    });
  };

  const handleCloseMarkReadyModal = () => {
    setSelectedOrderForReadiness(null);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          initial="hidden" animate="visible" exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* --- Header --- */}
          <header className="flex-shrink-0 flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                All Store Orders ({displayOrders.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {orders.length === 0 ? "Viewing Demo Orders" : "Manage your orders"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {displayOrders.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedOrders).map(([day, dayOrders]) => (
                  <div key={day}>
                    <h3 className="font-bold text-lg text-slate-600 dark:text-slate-300 mb-3">{day}</h3>
                    <div className="space-y-4">
                      {dayOrders.map((order) => (
                        <CustomerOrdersCard
                          key={order.id}
                          order={order}
                          onMarkReady={handleMarkReady}
                          isHighlighted={highlightOrderId === order.id}
                          storeId={storeId}
                          onUpdate={onOrderUpdated}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                <ShoppingCart className="w-16 h-16 mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold">No Orders Yet</h3>
                <p className="max-w-xs mt-2">As soon as customers place orders, they will appear here.</p>
              </div>
            )}
          </main>

          {/* --- Footer --- */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-5xl mx-auto">
              <motion.button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </footer>
        </motion.div>
      )}
      {selectedOrderForReadiness && (
        <MarkOrderReadyModal isOpen={!!selectedOrderForReadiness} onClose={handleCloseMarkReadyModal} order={selectedOrderForReadiness} onConfirm={handleConfirmMarkReady} isUpdating={isPending} />
      )}
    </AnimatePresence>
  );
};
