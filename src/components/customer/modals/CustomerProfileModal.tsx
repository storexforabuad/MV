'use client';

import React, { useMemo, useEffect, Fragment, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ShoppingCart, Package, X, Wallet, Settings, MapPin, Mail, LogOut, ChevronRight, ExternalLink, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useModalBackNavigation } from '@/hooks/useModalBackNavigation';
import { Order } from '../../../hooks/useOrders';
import { OrderDetailCard } from '../cards/OrderDetailCard';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { CartItem } from '@/lib/cartContext';
import { formatPrice } from '@/utils/price';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  storeId: string;
  addOrder: (products: (Product | CartItem)[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied?: boolean, deliveryMethod?: "home" | "pickup", orderNotes?: string, paymentEvidenceUrl?: string, paymentEvidenceFileName?: string) => Promise<Order>;
  storeMeta: StoreMeta;
  customer: Customer | null;
  highlightOrderId?: string | null;
  onNotificationRequest?: () => Promise<{ success: boolean; error?: string }>;
  onReorder?: (order: Order) => void;
  onRefresh?: () => void;
}

type Tab = 'orders' | 'wallet' | 'settings';

const formatDateGroup = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  orders,
  addOrder,
  storeMeta,
  customer,
  highlightOrderId,
  onNotificationRequest,
  onReorder,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [lookupEmail, setLookupEmail] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle back button navigation
  useModalBackNavigation(isOpen, onClose, 'profile-modal');

  // Load guest email from localStorage on mount
  useEffect(() => {
    if (isOpen && !customer) {
      const savedEmail = localStorage.getItem('guest_email');
      if (savedEmail) setLookupEmail(savedEmail);
    }
  }, [isOpen, customer]);

  const groupedOrders = useMemo(() => {
    if (!orders) return {};
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .reduce((acc, order) => {
        const orderDate = new Date(order.orderDate).toDateString();
        if (!acc[orderDate]) acc[orderDate] = [];
        acc[orderDate].push(order);
        return acc;
      }, {} as Record<string, Order[]>);
  }, [orders]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedOrders).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedOrders]);

  // Wallet Logic: Calculate Escrow Balance (held funds) and Spent Total
  const walletStats = useMemo(() => {
    let escrowBalance = 0;
    let releasedTotal = 0;
    let activeEscrows = 0;

    orders.forEach(order => {
      // Sum prices of service products in the order
      const serviceProducts = order.products.filter(p => (p as any).productType === 'media-influencer');
      const serviceTotal = serviceProducts.reduce((sum, p) => sum + (p.price || 0), 0);

      if (order.paymentStatus === 'escrow-held') {
        escrowBalance += serviceTotal;
        activeEscrows++;
      } else if (order.paymentStatus === 'escrow-released') {
        releasedTotal += serviceTotal;
      }
    });

    return { escrowBalance, releasedTotal, activeEscrows };
  }, [orders]);

  const handleLookup = () => {
    if (!lookupEmail.includes('@')) return;
    setIsLookingUp(true);
    localStorage.setItem('guest_email', lookupEmail);
    // Trigger a refresh (the parent hook useOrders will pick this up from localStorage)
    if (onRefresh) onRefresh();
    setTimeout(() => setIsLookingUp(false), 1000);
  };

  const clearGuest = () => {
    localStorage.removeItem('guest_email');
    setLookupEmail('');
    if (onRefresh) onRefresh();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-t-[2rem] bg-white dark:bg-modal-background text-left align-middle shadow-2xl transition-all flex flex-col h-[92vh] sm:max-w-2xl sm:rounded-2xl sm:h-[85vh]">

                {/* Header */}
                <div className="shrink-0 px-6 pt-6 pb-4 bg-white dark:bg-modal-background">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {customer?.name || (lookupEmail ? lookupEmail.split('@')[0] : 'Guest Profile')}
                      </h2>
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {customer ? 'Member since ' + new Date(customer.id === 'guest' ? Date.now() : parseInt(customer.id) || Date.now()).getFullYear() : 'Browsing as Guest'}
                      </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl">
                    {(['orders', 'wallet', 'settings'] as Tab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${activeTab === tab
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                      >
                        {tab === 'orders' && <Package className="w-4 h-4" />}
                        {tab === 'wallet' && <Wallet className="w-4 h-4" />}
                        {tab === 'settings' && <Settings className="w-4 h-4" />}
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Content */}
                <div ref={scrollContainerRef} className="flex-grow overflow-y-auto custom-scrollbar">
                  <div className="px-6 py-6">

                    {/* Guest Lookup View */}
                    {!customer && !localStorage.getItem('guest_email') && activeTab === 'orders' && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl p-8 text-center border border-blue-100 dark:border-blue-800/50">
                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Mail className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Lookup your orders</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter the email you used at checkout to track your influencer service bookings and product orders.</p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={lookupEmail}
                            onChange={(e) => setLookupEmail(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                          />
                          <button
                            onClick={handleLookup}
                            disabled={isLookingUp || !lookupEmail.includes('@')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all"
                          >
                            {isLookingUp ? '...' : 'Track'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (orders.length > 0 || localStorage.getItem('guest_email')) && (
                      <div className="space-y-8">
                        {orders.length > 0 ? (
                          sortedDateKeys.map((dateKey) => (
                            <div key={dateKey}>
                               <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4 px-1">
                                {formatDateGroup(dateKey)}
                              </h3>
                              <div className="space-y-4">
                                {groupedOrders[dateKey].map(order => (
                                  <OrderDetailCard
                                    key={order.id}
                                    order={order}
                                    addOrder={addOrder}
                                    storeMeta={storeMeta}
                                    isHighlighted={highlightOrderId === order.id}
                                    onReorder={onReorder}
                                    onRefresh={onRefresh}
                                    storeId={storeMeta?.id}
                                  />
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-800">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">No orders found for this email</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Wallet Tab */}
                    {activeTab === 'wallet' && (
                      <div className="space-y-6">
                        {/* Hero Card */}
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white shadow-2xl">
                          <div className="absolute top-0 right-0 -m-4 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                          <div className="absolute bottom-0 left-0 -m-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-80">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-[0.2em]">Escrow Protected</span>
                            </div>
                            <h4 className="text-sm font-medium opacity-90 mb-1">Active Escrow Balance</h4>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-black">{formatPrice(walletStats.escrowBalance)}</span>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Released funds</p>
                                <p className="text-lg font-bold">{formatPrice(walletStats.releasedTotal)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Active services</p>
                                <p className="text-lg font-bold">{walletStats.activeEscrows}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-1">How Escrow Works</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                Your payment is held securely by BizCon. We only release it to the influencer once you approve their work or the delivery window passes.
                              </p>
                            </div>
                          </div>

                          <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Refund Requests</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                If a service isn't delivered within the timeframe, you can request a refund back to your payment method from this area.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                      <div className="space-y-8">
                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Account Information</h4>
                           <div className="space-y-4">
                             <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                 <Mail className="w-5 h-5" />
                               </div>
                               <div className="flex-1">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                                 <p className="text-sm font-bold text-gray-900 dark:text-white">{customer?.email || lookupEmail || 'N/A'}</p>
                               </div>
                               {!customer && lookupEmail && (
                                 <button onClick={clearGuest} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                   <LogOut className="w-5 h-5" />
                                 </button>
                               )}
                             </div>
                           </div>
                        </div>

                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Delivery Address</h4>
                           <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                             <div className="flex items-start gap-4 mb-4">
                               <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                 <MapPin className="w-5 h-5" />
                               </div>
                               <div className="flex-1">
                                 <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                   {customer?.deliveryAddress?.street || 'No address saved yet'}
                                 </p>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                   {customer?.deliveryAddress?.state || 'Nigerian Delivery'}
                                 </p>
                               </div>
                             </div>
                             <button className="w-full py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all">
                               Edit Address
                             </button>
                           </div>
                        </div>

                        {!customer && (
                          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                            <h4 className="text-lg font-bold mb-2">Create an account?</h4>
                            <p className="text-xs opacity-80 mb-6 leading-relaxed">Save your details securely and manage multiple delivery addresses across all BizCon stores.</p>
                            <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20">
                              Register Now
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Footer / Mobile Nav Hint */}
                <div className="shrink-0 p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950/20 flex justify-center">
                  <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 sm:hidden" />
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CustomerProfileModal;
