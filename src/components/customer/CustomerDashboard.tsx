
"use client";

import { ShoppingBag, Gift, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { CustomerStatCard } from './CustomerStatCard';
import { Order } from "@/types/order";
import { Customer } from "@/types/customer";
import { CustomerSection } from "./CustomerMobileNav";

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
  onSectionChange: (section: CustomerSection) => void;
  onOrdersModalOpen: () => void;
  onReferralsModalOpen: () => void;
  onWishlistModalOpen: () => void;
}

const colorGradients = {
  purple: "bg-gradient-to-br from-purple-500 to-indigo-600",
  green: "bg-gradient-to-br from-green-500 to-emerald-600",
  red: "bg-gradient-to-br from-red-500 to-rose-600",
};

export function CustomerDashboard({
  orders,
  customer,
  storeId,
  onSectionChange,
  onOrdersModalOpen,
  onReferralsModalOpen,
  onWishlistModalOpen,
}: CustomerDashboardProps) {
  
  const referralData = customer?.referralDataByStore?.[storeId];
  const referralCount = referralData?.referralCount || 0;

  const wishlistCount = 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
    >
      <CustomerStatCard
        label="My Orders"
        value={orders.length}
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
      <CustomerStatCard
        label="My Wishlist"
        value={wishlistCount}
        icon={<Heart className="w-6 h-6" />}
        gradient={colorGradients.red}
        onClick={onWishlistModalOpen}
      />
    </motion.div>
  );
}
