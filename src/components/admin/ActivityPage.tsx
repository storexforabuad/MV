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
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Launch Tracker Logic
  const PHASE_STORAGE_KEY = `launch_playbook_progress_${storeId}`;
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(PHASE_STORAGE_KEY);
    if (stored) {
      try {
        setCompletedPhases(JSON.parse(stored));
      } catch (e) {}
    }
  }, [storeId]);

  const togglePhase = (phaseNumber: number) => {
    setCompletedPhases(prev => {
      const updated = prev.includes(phaseNumber) 
        ? prev.filter(p => p !== phaseNumber) 
        : [...prev, phaseNumber];
      localStorage.setItem(PHASE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Caption copied to clipboard!'); 
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const topProduct = products.length > 0 ? products[0] : null;
  const storeUrl = `https://tinyurl.com/bizconnet/${storeId}`;
  
  const phase1Copy = `We are upgrading how you shop with us! Something exciting is coming... 🫣📦\n\nNo more waiting hours for me to reply to your DMs before you can order. We are making life easier for you. Guess what it is? 👀`;
  
  const phase2Copy = `🥳 OUR NEW DIGITAL CATALOG IS LIVE!!! 🛍️✨\n\nYou can now see everything we have in stock, check prices, and send your orders straight to my WhatsApp without any stress!\n\nClick here to check it out now 👉 ${storeUrl}`;
  
  const phase3Copy = topProduct 
    ? `Last chance! 🚨 Our launch promo ends at midnight. If you've been eyeing the ${topProduct.name}, click the link, add it to your cart, and send it to my WhatsApp right now! 🛒💨 👉 ${storeUrl}/product/${topProduct.id}`
    : `Wow! I love how neat the orders are coming into my WhatsApp! 🥺 Thank you for the love! The launch promo ends tomorrow. Browse the catalog and send in your orders here: ${storeUrl}`;

  const launchPhases = [
    { id: 1, title: 'Day 1: The Tease', copy: phase1Copy },
    { id: 2, title: 'Day 2: Grand Opening', copy: phase2Copy },
    { id: 3, title: 'Day 3: Social Proof', copy: phase3Copy },
  ];

  // Trending Products Logic
  const trendingProducts = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3)
    .filter(p => (p.views || 0) > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
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
          <p className="text-2xl font-black">{totalViews.toLocaleString()}</p>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Total Reach</p>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-600 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
          <TrendingUp className="h-6 w-6 mb-3 opacity-80" />
          <p className="text-2xl font-black">{todayOrders}</p>
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

      {/* Interactive Launch Checklist */}
      <motion.div id="launch-tracker" variants={itemVariants} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-violet-100 dark:bg-violet-900/30 p-2.5 rounded-xl">
              <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Launch Tracker</h3>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400">{completedPhases.length}/3 Phases Complete</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-violet-100 dark:border-violet-900/50 flex items-center justify-center relative">
            <svg className="w-full h-full absolute -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-violet-500"
                strokeDasharray={`${(completedPhases.length / 3) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            <span className="text-xs font-black text-violet-600 dark:text-violet-400">{Math.round((completedPhases.length / 3) * 100)}%</span>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {launchPhases.map((phase) => {
            const isCompleted = completedPhases.includes(phase.id);
            return (
              <div key={phase.id} className={`p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-60' : 'bg-white dark:bg-zinc-800 border-violet-100 dark:border-violet-900/50 shadow-sm'}`}>
                <div className="flex items-start sm:items-center justify-between mb-3 gap-3">
                  <h4 className={`font-black tracking-tight leading-tight pt-0.5 ${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
                    {phase.title}
                  </h4>
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
                {!isCompleted && (
                  <button
                    onClick={() => copyToClipboard(phase.copy)}
                    className="w-full flex items-center justify-center gap-2 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors mb-2"
                  >
                    <Share2 className="w-4 h-4" /> Copy Caption
                  </button>
                )}
              </div>
            );
          })}

          <AnimatePresence>
            {completedPhases.length === 3 && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                className="p-5 sm:p-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl text-white text-center shadow-lg relative overflow-hidden mt-4"
              >
                <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black tracking-tight mb-2">Launch Complete! 🚀</h4>
                  <p className="text-xs sm:text-sm font-medium opacity-90 mb-5 max-w-sm mx-auto leading-relaxed">
                    You've successfully completed the 3-day launch playbook. Keep the momentum going by sharing your store link daily!
                  </p>
                  <button
                    onClick={openSocialModal}
                    className="bg-white text-violet-700 hover:bg-violet-50 font-bold py-3 px-6 rounded-xl text-sm w-full sm:w-auto transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mx-auto"
                  >
                    <Share2 className="w-4 h-4" /> Share Store Link
                  </button>
                </div>
              </motion.div>
            )}
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
