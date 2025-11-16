'use client';

import { X, Truck, ShoppingBag, User, MapPin, Phone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { StoreOrder, getReadyForDeliveryOrders } from '@/app/actions/orderActions';
import Image from 'next/image';
import { formatPrice } from '@/utils/price';

interface DeliveriesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

const DeliveryOrderCard = ({ order }: { order: StoreOrder }) => {
    const { customerInfo, products, orderStatus } = order;

    const getStatusChip = () => {
        switch (orderStatus) {
            case 'ready':
                return <div className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">Ready for Delivery</div>;
            case 'partially-ready':
                return <div className="px-2 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-full">Partially Ready</div>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        <h4 className="font-semibold text-md text-slate-700 dark:text-slate-200">{customerInfo.name}</h4>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                        <Phone className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300">{customerInfo.phoneNumber}</span>
                    </div>
                </div>
                {getStatusChip()}
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700/50 px-4">
                {products.filter(p => p.status === 'ready').map(product => (
                    <div key={product.id} className="flex items-center gap-4 py-3">
                        <div className="aspect-square w-12 h-12 relative rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700">
                            <Image src={product.images[0]} alt={product.name} layout="fill" objectFit="cover" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{product.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {product.quantity}</p>
                        </div>
                    </div>
                ))}
            </div>

             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{customerInfo.deliveryAddress.street}, {customerInfo.deliveryAddress.state}</span>
                </div>
            </div>
        </div>
    );
};

export const DeliveriesHubModal = ({ isOpen, onClose, storeId }: DeliveriesHubModalProps) => {
    const [orders, setOrders] = useState<StoreOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-900"
                >
                    <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <Truck className="w-6 h-6 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Deliveries Hub</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </button>
                    </header>
                    <main className="flex-grow p-4 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-slate-500">
                                    <p>Loading deliveries...</p>
                                </div>
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <DeliveryOrderCard key={order.id} order={order} />
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
                </motion.div>
            )}
        </AnimatePresence>
    );
};