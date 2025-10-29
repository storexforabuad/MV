'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Receipt, Order } from '../common/Receipt';

export function ReceiptModal({ isOpen, onClose, order }: { isOpen: boolean, onClose: () => void, order: Order }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the modal content
                        className="relative w-full max-w-md"
                    >
                        <Receipt order={order} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
