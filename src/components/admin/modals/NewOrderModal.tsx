import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewOrder: () => void;
    orderId: string;
    customerName: string;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
    isOpen,
    onClose,
    onViewOrder,
    orderId,
    customerName
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 flex flex-col items-center text-center">
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-4">
                                <ShoppingBag className="w-8 h-8" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                New Order Received!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                <span className="font-medium text-gray-900 dark:text-white">{customerName}</span> just placed a new order #{orderId.slice(-6)}.
                            </p>

                            {/* Action Button */}
                            <button
                                onClick={onViewOrder}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                View Order
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
