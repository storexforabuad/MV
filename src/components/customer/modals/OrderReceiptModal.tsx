'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, CheckCircle, Package, MessageSquare, Download, Share2, Printer } from 'lucide-react';
import { Order } from '@/hooks/useOrders';
import { formatPrice } from '@/utils/price';
import { handleSendWhatsAppReceipt } from '@/utils/whatsapp';

interface OrderReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ isOpen, onClose, order }) => {
    if (!order) return null;

    const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const totalAmount = order.products.reduce((acc, p) => acc + p.price * (p.quantity || 1), 0);
    const reference = order.paymentEvidenceFileName || 'N/A';

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-hidden">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] bg-white dark:bg-gray-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92vh]">

                                {/* Header */}
                                <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Order Receipt</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{orderDate}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                                    {/* Summary Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reference</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{reference}</p>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Order Items</h4>
                                        <div className="space-y-3">
                                            {order.products.map((p, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                            <Package className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium">Qty: {p.quantity || 1}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(p.price * (p.quantity || 1))}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="pt-4 border-t-2 border-dashed border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center px-1">
                                            <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Total Paid</p>
                                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatPrice(totalAmount)}</p>
                                        </div>
                                    </div>

                                    {/* Escrow Banner */}
                                    <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <Share2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Secure Escrow Payment</h5>
                                                <p className="text-xs text-blue-700/70 dark:text-blue-300/70 leading-relaxed">
                                                    Your money is held safely in escrow. It will only be released to the vendor once delivery is confirmed or the protection window closes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 space-y-3 flex-shrink-0">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => window.print()}
                                            className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Print
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: 'Order Receipt',
                                                        text: `Receipt for order #${order.id.slice(0, 8)}`,
                                                        url: window.location.href
                                                    });
                                                }
                                            }}
                                            className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>

                                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pt-4">
                                        Secured by <span className="text-gray-600 dark:text-gray-300">BCN™</span>
                                    </p>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default OrderReceiptModal;
