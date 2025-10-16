
"use client";

import { ShoppingBag, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { CustomerStatCard } from './CustomerStatCard';
import { Order } from "@/hooks/useOrders";
import { Customer } from "@/types/customer";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

interface CustomerDashboardProps {
  orders: Order[];
  customer: Customer | null;
  storeId: string;
  onOrdersModalOpen: () => void;
  onReferralsModalOpen: () => void;
}

const colorGradients = {
  purple: "bg-gradient-to-br from-purple-500 to-indigo-600",
  green: "bg-gradient-to-br from-green-500 to-emerald-600",
};

export function CustomerDashboard({
  orders,
  customer,
  storeId,
  onOrdersModalOpen,
  onReferralsModalOpen,
}: CustomerDashboardProps) {
  
  const referralData = customer?.referralDataByStore?.[storeId];
  const referralCount = referralData?.referralCount || 0;

  const ordersCount = orders ? orders.length : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
    >
      <CustomerStatCard
        label="My Orders"
        value={ordersCount}
        icon={<ShoppingBag className="w-6 h-6" />}
        gradient={colorGradients.purple}
        onClick={onOrdersModalOpen}
      />
      <CustomerStatCard
        label="My Referrals"
        value={referralCount}
        icon={<Gift className="w-6 h-6" />}
        gradient={colorGradients.green}
        onClick={onReferralsModalOpen}
      />
    </motion.div>
  );
}
