'use client';

import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  Share2,
  TrendingUp,
  ShoppingBag,
  Lightbulb,
  CheckCircle2,
  Plus,
  Rocket,
  Users,
  Eye,
  Megaphone,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Calendar,
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Notification } from '@/types/notification';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { StoreOrder } from '@/lib/db';

interface ActivityPageProps {
  storeId: string;
  notifications: Notification[];
  onNotificationAction: (n: Notification) => void;
  onDismissNotification: (id: string) => void;
  openSocialModal: () => void;
  openSubscriptionModal: () => void;
  onAddProductClick: () => void;
  storeMeta: StoreMeta | null;
  products: Product[];
  orders: StoreOrder[];
}

/**
 * AnimatedNumber - Smoothly counts from 0 to the target value.
 * Defined at module scope to avoid React anti-pattern of nested component definitions.
 */
const AnimatedNumber = ({ value, duration = 800 }: { value: number | string; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  useEffect(() => {
    const raw = String(value);
    const match = raw.match(/^([^\d]*?)([\d.]+)(.*)$/);
    if (!match || reducedMotion) {
      setDisplayValue(raw);
      return;
    }

    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    if (isNaN(target) || target === 0) {
      setDisplayValue(raw);
      return;
    }

    const isDecimal = numStr.includes('.');
    const decimalPlaces = isDecimal ? (numStr.split('.')[1]?.length || 0) : 0;
    let startTime: number | null = null;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplayValue(`${prefix}${isDecimal ? current.toFixed(decimalPlaces) : Math.round(current)}${suffix}`);
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration, reducedMotion]);

  return <>{displayValue}</>;
};

const ActivityPage: React.FC<ActivityPageProps> = ({
  storeId,
  notifications,
  onNotificationAction,
  onDismissNotification,
  openSocialModal,
  openSubscriptionModal,
  onAddProductClick,
  storeMeta,
  products,
  orders
}) => {

  // Calculate display stats
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.orderDate);
    return orderDate.toDateString() === new Date().toDateString();
  }).length;

  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0) + (storeMeta?.storePageViews || 0);

  // Subscription Logic Refinement
  const isInfluencer = storeMeta?.isInfluencer || storeMeta?.isFreePlan;
  const subscriptionStatus = storeMeta?.subscriptionStatus || 'trial';

  const getNextBillingDate = () => {
    if (isInfluencer) {
      // Influencer logic from SubscriptionModal: createdAt + 1 week recursive
      const baseDate = storeMeta?.createdAt ?
        (typeof storeMeta.createdAt === 'string' ? new Date(storeMeta.createdAt) :
          'toDate' in storeMeta.createdAt ? (storeMeta.createdAt as any).toDate() : new Date())
        : new Date();
      return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    if (storeMeta?.subscriptionNextBillingDate) {
      const val = storeMeta.subscriptionNextBillingDate;
      if (typeof val === 'string') return new Date(val);
      if ('toDate' in val) return (val as any).toDate();
      if ('seconds' in (val as any)) return new Date((val as any).seconds * 1000);
    }

    if (subscriptionStatus === 'trial' && storeMeta?.subscriptionTrialEndsAt) {
      const val = storeMeta.subscriptionTrialEndsAt;
      if (typeof val === 'string') return new Date(val);
      if ('toDate' in val) return (val as any).toDate();
      if ('seconds' in (val as any)) return new Date((val as any).seconds * 1000);
    }

    return null;
  };

  const nextBillingDate = getNextBillingDate();
  const renewalText = nextBillingDate ?
    nextBillingDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }) :
    null;

  // --- POWER TIPS STATE ---
  const powerTips = [
    {
      id: "tip1",
      icon: Megaphone,
      color: "from-blue-500 to-indigo-500",
      text: "Running a promo? Broadcast it to your customers using the Social Hub."
    },
    {
      id: "tip2",
      icon: Sparkles,
      color: "from-amber-400 to-orange-500",
      text: "Consistently add new products to keep returning customers engaged."
    },
    {
      id: "tip3",
      icon: Share2,
      color: "from-emerald-400 to-teal-500",
      text: "Share your store link on WhatsApp Status daily to drive organic traffic."
    },
    {
      id: "tip4",
      icon: Eye,
      color: "from-pink-500 to-rose-500",
      text: "Write detailed product descriptions to reduce customer questions."
    },
    {
      id: "tip5",
      icon: Flame,
      color: "from-violet-500 to-purple-500",
      text: "Use high-quality imagery to boost your conversion rates."
    }
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % powerTips.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [powerTips.length]);

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % powerTips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + powerTips.length) % powerTips.length);
  };
  // --- END POWER TIPS STATE ---

  // Trending Products Logic
  const trendingProducts = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3)
    .filter(p => (p.views || 0) > 0);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.9, rotate: -1 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        mass: 0.8
      }
    }
  };

  // Notification Refinement Logic
  const processedNotifications = notifications.map(n => {
    // If it's a subscription notification and user is active/influencer
    if (n.title.toLowerCase().includes('subscription') || n.message.toLowerCase().includes('trial')) {
      if (subscriptionStatus === 'active' || isInfluencer) {
        return {
          ...n,
          title: "Premium Active",
          message: `Subscription auto-renews on ${renewalText}.`,
          actionLabel: "VIEW DETAILS",
          type: 'success' as Notification['type']
        };
      }
    }
    return n;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 overflow-x-hidden space-y-6 pb-28 pt-2"
    >
      {/* Premium Social Power Card */}
      <motion.button
        variants={itemVariants}
        onClick={openSocialModal}
        className="w-full relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 animate-gradient-slow group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />

        <div className="relative flex flex-col items-start gap-4">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-white/20">
            <Share2 className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>

          <div className="text-left w-full">
            <h2 className="text-3xl font-black tracking-tight drop-shadow-md">Social Hub</h2>
            <p className="text-blue-100 font-medium mt-1 text-lg opacity-90">Boom your sales everywhere</p>
          </div>

          <div className="flex items-center gap-3 mt-4 w-full">
            <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl py-3 px-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Suggested</span>
              <Megaphone className="h-4 w-4 text-white opacity-60" />
            </div>
            <div className="bg-white text-blue-600 p-3 rounded-full shadow-lg group-hover:translate-x-1 transition-transform">
              <Plus className="h-6 w-6" strokeWidth={3} />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Engagement Pulse */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
          <Eye className="h-6 w-6 mb-3 opacity-80" />
          <p className="text-2xl font-black"><AnimatedNumber value={totalViews} /></p>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Total Reach</p>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-600 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
          <TrendingUp className="h-6 w-6 mb-3 opacity-80" />
          <p className="text-2xl font-black"><AnimatedNumber value={todayOrders} /></p>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Orders Today</p>
        </div>
      </motion.div>

      {/* Dynamic Trending Section or Empty State Shortcut */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-2 flex items-center gap-2">
          {products.length > 0 ? <TrendingUp className="h-4 w-4 text-orange-500" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
          {products.length > 0 ? "Now Trending" : "Getting Started"}
        </h3>

        {products.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
            {trendingProducts.length > 0 ? trendingProducts.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-3 shadow-sm">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-2 bg-zinc-100 dark:bg-zinc-800">
                  <img src={product.images[0] || 'https://placehold.co/150'} alt={product.name} className="object-cover w-full h-full" />
                </div>
                <p className="text-[11px] font-black text-zinc-900 dark:text-white truncate">{product.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Eye className="h-3 w-3 text-zinc-400" />
                  <span className="text-[10px] font-bold text-zinc-400">{product.views || 0} views</span>
                </div>
              </div>
            )) : (
              <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <TrendingUp className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-500">No products have views yet. Share your store to start trending!</p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onAddProductClick}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2rem] p-6 text-white text-left relative overflow-hidden shadow-xl group hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                <Plus className="h-8 w-8 text-white" strokeWidth={3} />
              </div>
              <div>
                <h4 className="text-xl font-black">Upload First Product</h4>
                <p className="text-blue-100 text-sm font-medium mt-0.5">Start your business journey now</p>
              </div>
              <ArrowRight className="h-6 w-6 ml-auto opacity-60 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            </div>
          </button>
        )}
      </motion.div>

      {/* Power Tips Section */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Power Tip</h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={prevTip} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-400 w-8 text-center">{currentTipIndex + 1}/{powerTips.length}</span>
            <button onClick={nextTip} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative z-10 min-h-[80px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTipIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4"
            >
              <div className={`mt-1 shrink-0 p-2 rounded-full bg-gradient-to-br ${powerTips[currentTipIndex].color}`}>
                {(() => {
                  const TipIcon = powerTips[currentTipIndex].icon;
                  return <TipIcon className="w-4 h-4 text-white" />;
                })()}
              </div>
              <p className="text-sm sm:text-base font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed">
                "{powerTips[currentTipIndex].text}"
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Live Pulse Feed */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-500 rounded-full" />
            Live Pulse
          </h2>
        </div>

        <div className="space-y-4">
          {processedNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              variants={itemVariants}
              className={`relative group bg-white dark:bg-zinc-800 rounded-[2rem] p-5 shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all ${!notification.isRead ? 'shadow-blue-500/10' : ''}`}
            >
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full ${notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'critical' ? 'bg-red-500' :
                  notification.type === 'action' ? 'bg-amber-500' :
                    'bg-blue-500'
                }`} />

              <div className="flex items-start gap-5 pl-2">
                <div className={`p-3.5 rounded-2xl shadow-inner ${notification.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' :
                  notification.type === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                    notification.type === 'action' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                      'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                  }`}>
                  {notification.type === 'success' ? <ShoppingBag className="h-6 w-6" /> :
                    notification.type === 'critical' ? <BellIcon className="h-6 w-6" /> :
                      notification.type === 'activity' ? <TrendingUp className="h-6 w-6" /> :
                        <Users className="h-6 w-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-zinc-900 dark:text-white text-[15px] truncate uppercase tracking-tight">
                      {notification.title}
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter whitespace-nowrap bg-zinc-100 dark:bg-zinc-700/50 px-2 py-0.5 rounded-full">
                      {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                    {notification.message}
                  </p>

                  {notification.actionLabel && (
                    <button
                      onClick={() => onNotificationAction(notification)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-100 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-200/50 dark:border-zinc-700"
                    >
                      {notification.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {processedNotifications.length === 0 && (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8">
              <div className="bg-zinc-100 dark:bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-700 shadow-inner">
                <CheckCircle2 className="h-8 w-8 text-zinc-400" />
              </div>
              <h4 className="text-zinc-900 dark:text-white font-black text-lg">All Systems Go</h4>
              <p className="text-zinc-500 dark:text-zinc-500 font-bold text-sm mt-1">No new notifications. Your store is running smoothly!</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default ActivityPage;
