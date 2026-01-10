'use client';
import { Lightbulb, Navigation, ShoppingBag, BarChart2, Sparkles, TrendingUp, Gift, Package, Globe, DollarSign, Truck, Star, Share2, Tags, Zap, Users } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TipsModalProps {
  handleClose: () => void;
}

type TabType = 'getting-started' | 'products' | 'growth' | 'orders';

interface Tip {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  proTip?: string;
}

const tipsData: Record<TabType, Tip[]> = {
  'getting-started': [
    {
      icon: Navigation,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-100 dark:bg-sky-900/30',
      title: 'Navigate Like a Pro',
      description: 'Use the bottom navigations tabs to quickly switch between Home(Overview), Store(Preview), Products(Upload), and Categories. Each section gives you powerful tools to manage your business.',
    },
    {
      icon: BarChart2,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      title: 'Interactive Dashboard Cards',
      description: 'Tap any card (Views, Revenue, Products, etc.) to see detailed analytics and insights. These aren\'t just numbers—they\'re gateways to deeper information!',
    },
    {
      icon: Zap,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      title: 'Refresh Anytime',
      description: 'Hit the Refresh button at the top to get the latest data on your products, orders, and analytics. Stay up-to-date in real-time!',
    },
  ],
  'products': [
    {
      icon: Package,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      title: 'Product Types',
      description: 'MV supports both General Products (clothing, accessories, etc.) and Vehicle Products (cars, motorcycles). Each type has specialized fields to showcase your inventory perfectly.',
      proTip: 'Vehicles can include detailed specs like mileage, transmission type, and customs duty status—perfect for the Nigerian market!',
    },
    {
      icon: Tags,
      iconColor: 'text-pink-500',
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
      title: 'Smart Stock Management',
      description: 'Mark products as Limited Stock to create urgency, or Sold Out to let customers know when items are gone. Tap the Popular, Limited, or Sold Out cards to quickly filter and manage these products.',
    },
    {
      icon: ShoppingBag,
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      title: 'Size Variants',
      description: 'For clothing and footwear, use size options like Baby Clothes, Kids Shoes, or Adult Shoes. Customers can select their size directly, reducing returns and confusion.',
      proTip: 'Available sizes auto-populate based on the size option you choose—no manual entry needed!',
    },
    {
      icon: Sparkles,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      title: 'Promotions & Pricing',
      description: 'Use the "On Promo" feature to highlight discounted items. Set both Original Price and Sale Price to show customers the savings they\'re getting.',
    },
  ],
  'growth': [
    {
      icon: Globe,
      iconColor: 'text-slate-600 dark:text-slate-300',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      title: 'Bizcon Network Benefits',
      description: 'You\'re part of the Business Connect Network—powered by partnerships with Google, Paystack, and OPay. This means cutting-edge tech, secure payments, and growing customer reach for your store.',
      proTip: 'Tap the (Biz+Con)™ card to learn more about how the network helps you succeed!',
    },
    {
      icon: Star,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      title: 'Ambassador Program',
      description: 'Refer other businesses to join Bizcon and earn rewards! Progress through tiers (Bronze → Silver → Gold) as you refer more vendors. The more they succeed, the more you earn.',
      proTip: 'Check the Ambassador Hub to track your referrals, see their progress, and unlock higher commission rates.',
    },
    {
      icon: Share2,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      title: 'Social Media Made Easy',
      description: 'Use the Share card to create ready-to-post content for Instagram, Facebook, WhatsApp, and more. Choose from professional caption templates, download product images, and share with one tap!',
      proTip: 'The "Smart Suggestions" feature recommends your best products to promote based on views, sales, and stock levels.',
    },
    {
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      title: 'Boost Your Views',
      description: 'More views = more sales! Share your store link everywhere—WhatsApp status, Instagram bio, Facebook groups. The Views card tracks how many people are checking out your products.',
    },
  ],
  'orders': [
    {
      icon: DollarSign,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      title: 'Track Your Finances',
      description: 'The Revenue, Expenses, and Commission cards give you a complete picture of your business finances. Know exactly what you\'re earning, spending, and paying in network fees.',
      proTip: 'Tap each card for detailed breakdowns and transaction history.',
    },
    {
      icon: Truck,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      title: 'Deliveries Hub',
      description: 'When you mark orders as "Ready for Delivery," they appear in the Deliveries Hub with customer details, addresses, and product lists—making fulfillment a breeze.',
    },
    {
      icon: Users,
      iconColor: 'text-cyan-500',
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
      title: 'Customer Management',
      description: 'The Customers card shows everyone who\'s ordered from you. Track repeat buyers, view order history, and build relationships that keep them coming back.',
    },
    {
      icon: Gift,
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      title: 'Multiple Revenue Streams',
      description: 'Your income isn\'t just from sales! Earn from Ambassador referrals, commissions on network transactions, and promotional bonuses. Diversify and grow!',
    },
  ],
};

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 border-b-2 ${active
      ? 'text-orange-600 dark:text-orange-400 border-orange-500 dark:border-orange-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-orange-500 dark:hover:text-orange-300 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-gray-50 dark:hover:bg-slate-800/50'
      }`}
  >
    {/* Desktop: Always show icon and label */}
    <Icon className="hidden sm:block w-5 h-5" />
    <span className="hidden sm:inline">{label}</span>

    {/* Mobile: Show icon when inactive, show prominent label when active */}
    <AnimatePresence mode="wait">
      {active ? (
        <motion.span
          key="label"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1]
          }}
          className="sm:hidden text-sm font-bold whitespace-nowrap"
        >
          {label}
        </motion.span>
      ) : (
        <Icon key="icon" className="sm:hidden w-5 h-5" />
      )}
    </AnimatePresence>
  </button>
);

const TipCard = ({ tip }: { tip: Tip }) => {
  const Icon = tip.icon;
  return (
    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${tip.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${tip.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-gray-800 dark:text-white mb-1.5">
            {tip.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {tip.description}
          </p>
        </div>
      </div>
      {tip.proTip && (
        <div className="ml-13 pl-3 border-l-2 border-yellow-400 dark:border-yellow-500">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
              <span className="font-bold">Pro Tip:</span> {tip.proTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TipsModal({ handleClose }: TipsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('getting-started');

  const tabs: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
    { id: 'getting-started', label: 'Start', icon: Zap },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: Truck },
  ];

  const currentTips = tipsData[activeTab];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100vh' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100vh' }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-900"
      >
        {/* Decorative gradient background (optional) */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-br from-yellow-50 via-orange-50/30 to-white dark:from-yellow-900/10 dark:via-orange-900/5 dark:to-slate-900 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                Tips & Tricks
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Master your store</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
          </header>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
            <div className="max-w-3xl mx-auto space-y-4">
              {currentTips.map((tip, index) => (
                <TipCard key={index} tip={tip} />
              ))}
            </div>
          </main>

          {/* Footer */}
          <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-900 dark:to-transparent pointer-events-none" />
            <div className="relative max-w-3xl mx-auto">
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Got it, Let's Go! 🚀
              </button>
            </div>
          </footer>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
