'use client';

import { motion, AnimatePresence } from 'framer-motion';
<span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{customerInfo.phoneNumber}</span>
            </div >
  <div className="flex items-start gap-3">
    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
    <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{customerInfo.deliveryAddress.street}, {customerInfo.deliveryAddress.state}</span>
  </div>
          </div >
        </div >
      )}

<div className="divide-y divide-slate-100 dark:divide-slate-700/50 px-5 py-2">
  {products.map((product: any, index: number) => (
    <OrderProductRow key={product.id || index} product={product} />
  ))}
</div>

{/* Payment Evidence Viewer - for restaurant orders with payment evidence */ }
      <PaymentEvidenceViewer
        paymentEvidenceUrl={order.paymentEvidenceUrl}
        paymentEvidenceFileName={order.paymentEvidenceFileName}
        paymentEvidenceUploadedAt={order.paymentEvidenceUploadedAt}
        paymentStatus={order.paymentStatus}
      />

      <button
        onClick={() => onMarkReady(order)}
        disabled={order.orderStatus === 'ready'}
        className={`w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white transition-colors rounded-b-2xl rounded-t-none mt-2 ${order.orderStatus === 'ready'
          ? 'bg-slate-400 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
          }`}
      >
        <CheckCircle className="w-5 h-5" />
        <span>{order.orderStatus === 'ready' ? 'Shipped' : 'Mark as Ready'}</span>
      </button>
    </motion.div >
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

  const groupedOrders = groupOrdersByDay(orders);
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
                All Store Orders ({orders.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage your orders</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* --- Main Scrollable Content --- */}
          <main className="flex-grow w-full max-w-5xl mx-auto overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            {orders.length > 0 ? (
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