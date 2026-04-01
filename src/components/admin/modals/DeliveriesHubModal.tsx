'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ShoppingBag, User, MapPin, Phone, MessageCircle, ReceiptIcon, Package } from 'lucide-react';
import { StoreOrder, getReadyForDeliveryOrders } from '@/app/actions/orderActions';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import { Naira } from '@/components/common/Naira';
import { ReceiptModal } from '@/components/modals/ReceiptModal';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface DeliveriesHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    storeType?: string;
}

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

const DeliveryOrderCard = ({ order, onViewReceipt, storeType }: { order: StoreOrder, onViewReceipt: (order: StoreOrder) => void, storeType?: string }) => {
    const { customerInfo, products } = order;
    const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(customerInfo.phoneNumber)}`;
    const isServiceOrder = products.some(p => p.productType === 'media-influencer' || (p as any).platform);

    const getStatusBadge = () => {
        if (storeType !== 'media-influencer' && !isServiceOrder) return null;

        switch (order.orderStatus) {
            case 'pending-review':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                        <Clock className="w-3 h-3" />
                        Under Review
                    </div>
                );
            case 'ready':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-800/50">
                        <AlertCircle className="w-3 h-3" />
                        Awaiting Submission
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
                            <User className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{customerInfo.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">Order #{order.id.slice(-6).toUpperCase()}</p>
                                {getStatusBadge()}
                            </div>
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
                    {order.orderNotes && (
                        <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/20">
                            <p className="text-[10px] font-black text-yellow-800 dark:text-yellow-400 uppercase tracking-widest mb-1 items-center flex gap-2">
                                <AlertCircle size={12} /> Brand Note:
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 italic font-medium leading-relaxed">"{order.orderNotes}"</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/50 px-6 pb-2">
                {products.map(product => (
                    <OrderProductRow key={product.id} product={product} />
                ))}
            </div>

            <button
                onClick={() => onViewReceipt(order)}
                className="w-full flex items-center justify-center gap-2 py-5 text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 transition-all rounded-b-[2rem] rounded-t-none mt-4 shadow-lg shadow-indigo-500/20"
            >
                <ReceiptIcon className="w-5 h-5" />
                <span>View Receipt</span>
            </button>
        </div>
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

export const DeliveriesHubModal = ({ isOpen, onClose, storeId, storeType }: DeliveriesHubModalProps) => {
    const [orders, setOrders] = useState<StoreOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<StoreOrder | null>(null);

    useEffect(() => {
        if (isOpen && storeId) {
            setIsLoading(true);
            getReadyForDeliveryOrders(storeId)
                .then(setOrders)
                .catch(err => {
                    console.error("Failed to fetch ready orders:", err);
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, storeId]);

    const groupedOrders = groupOrdersByDay(orders);
    const modalVariants = { hidden: { opacity: 0, y: '100%' }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } };

    return (
        <>
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
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                    {storeType === 'media-influencer' ? 'Fulfillment Hub' : 'Deliveries Hub'} ({orders.length})
                                </h2>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest italic font-medium">
                                    {storeType === 'media-influencer' ? 'Active Campaigns & Deliverables' : 'Ready for delivery'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 via-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
                                <Truck className="w-6 h-6 text-white" />
                            </div>
                        </header>

                        {/* --- Main Scrollable Content --- */}
                        <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-slate-500">
                                        <p>Loading deliveries...</p>
                                    </div>
                                </div>
                            ) : orders.length > 0 ? (
                                <div className="space-y-6">
                                    {Object.entries(groupedOrders).map(([day, dayOrders]) => (
                                        <div key={day}>
                                            <h3 className="font-bold text-lg text-slate-600 dark:text-slate-300 mb-3">{day}</h3>
                                            <div className="space-y-4">
                                                {dayOrders.map(order => (
                                                    <DeliveryOrderCard key={order.id} order={order} onViewReceipt={setSelectedOrderForReceipt} storeType={storeType} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                                    <ShoppingBag className="w-16 h-16 mb-4 text-slate-400" />
                                    <h3 className="text-xl font-semibold">No active fulfillments</h3>
                                    <p className="max-w-xs mt-2">When an order is ready or awaiting deliverable submission, it will appear here.</p>
                                </div>
                            )}
                        </main>

                        {/* --- Footer --- */}
                        <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-950 dark:to-transparent pointer-events-none" />
                            <div className="relative max-w-5xl mx-auto">
                                <motion.button
                                    onClick={onClose}
                                    className="w-full bg-gradient-to-r from-lime-500 via-green-600 to-emerald-700 hover:from-lime-600 hover:via-green-700 hover:to-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Done
                                </motion.button>
                            </div>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
            {selectedOrderForReceipt && (
                <ReceiptModal
                    isOpen={!!selectedOrderForReceipt}
                    onClose={() => setSelectedOrderForReceipt(null)}
                    orders={[{
                        ...selectedOrderForReceipt,
                        products: selectedOrderForReceipt.products.map(p => ({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            quantity: (p as any).quantity || 1,
                            selectedSize: (p as any).selectedSize
                        }))
                    }]}
                />
            )}
        </>
    );
};
