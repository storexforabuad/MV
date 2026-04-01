'use client';

interface OrdersModalProps {
  totalOrders: number;
  handleClose: () => void;
}

const OrdersModal = ({ totalOrders }: OrdersModalProps) => {
  return (
    <div className="p-6 pt-12 text-center">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{totalOrders}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Orders</p>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            This card shows the combined number of times customers have clicked &quot;Order Now&quot; from a product page or your cart.
        </p>
    </div>
  );
};

export default OrdersModal;
