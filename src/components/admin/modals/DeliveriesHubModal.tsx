'use client';

import { Truck, ShoppingBag, User, MapPin, Phone, MessageCircle, ReceiptIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { StoreOrder, getReadyForDeliveryOrders } from '@/app/actions/orderActions';
import Image from 'next/image';
import { isGeneralProduct } from '@/utils/productHelpers';
import { formatPrice } from '@/utils/price';
import { ReceiptModal } from '../../modals/ReceiptModal';

interface DeliveriesHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
}

const OrderProductRow = ({ product }: { product: any }) => {
    return (
        <div className="flex items-center gap-4 py-3">
            <div className="aspect-square w-12 h-12 relative rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700">
                <Image src={product.images[0]} alt={product.name} layout="fill" objectFit="cover" />
            </div>
            <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{product.name}</p>
                {product.selectedSize && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mt-0.5 mb-0.5">
                        Size: {product.selectedSize}
                    </span>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {product.quantity}</p>
            </div>
        </div>
    );
};

const DeliveryOrderCard = ({ order, onViewReceipt }: { order: StoreOrder, onViewReceipt: (order: StoreOrder) => void }) => {
    const { customerInfo, products } = order;

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{customerInfo.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <a href={`tel:${customerInfo.phoneNumber}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
                            <Phone className="w-5 h-5" />
                        </a>
                        <a href={`https://wa.me/${customerInfo.phoneNumber.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <div className="space-y-3 pl-1">
                    <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{customerInfo.phoneNumber}</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{customerInfo.deliveryAddress.street}, {customerInfo.deliveryAddress.state}</span>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50 px-5 py-2">
                {products.filter(p => isGeneralProduct(p) && p.status === 'ready').map(p => {
                    const product = p as import('@/types/product').GeneralProduct;
                    return (
                        <OrderProductRow key={product.id} product={product} />
                    );
                })}
            </div>

            <button
                onClick={() => onViewReceipt(order)}
                className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-colors rounded-b-2xl rounded-t-none mt-2"
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

export const DeliveriesHubModal = ({ isOpen, onClose, storeId }: DeliveriesHubModalProps) => {
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
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    Deliveries Hub ({orders.length})
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Ready for delivery</p>
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
                                                    <DeliveryOrderCard key={order.id} order={order} onViewReceipt={setSelectedOrderForReceipt} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                                    <ShoppingBag className="w-16 h-16 mb-4 text-slate-400" />
                                    <h3 className="text-xl font-semibold">No Orders Ready for Delivery</h3>
                                    <p className="max-w-xs mt-2">When you mark an order as ready, it will appear here.</p>
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