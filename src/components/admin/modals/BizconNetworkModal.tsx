'use client';

import { X, Zap, TrendingUp, Star } from 'lucide-react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface BizconNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Animation variants for the container and items
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.4 } },
};

// A reusable component for displaying a feature with an icon
const FeatureItem = ({ icon, title, children, className }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) => (
  <motion.div variants={itemVariants} className="flex items-start space-x-4">
    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${className}`}>
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{children}</p>
    </div>
  </motion.div>
);

export const BizconNetworkModal = ({ isOpen, onClose }: BizconNetworkModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100vh' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100vh' }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          // Adaptive background for light and dark modes
          className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-900"
        >
          {/* Decorative gradients, only visible in dark mode */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-br from-blue-900/80 via-slate-900 to-slate-900 z-0 hidden dark:block" />
          <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-50 hidden dark:block" />
          
          <div className="relative z-10 flex flex-col h-full">
            <header className="flex items-center justify-between p-4 flex-shrink-0">
              {/* Adaptive text and button colors */}
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 ai-text-gradient">(Biz+Con)™ Network</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </button>
            </header>

            <main className="flex-grow p-6 overflow-y-auto pb-32">
              <motion.div 
                className="max-w-md mx-auto space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants} className="text-center space-y-2">
                  {/* Adaptive header text color */}
                  <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Welcome Aboard!
                  </h1>
                  <p className="text-lg text-slate-500 dark:text-slate-400">
                    We're excited to have you join the Business Connect Network—built for Vendors, by Vendors.
                  </p>
                </motion.div>

                <div className="space-y-8">
                  <FeatureItem 
                    icon={<Zap className="w-6 h-6 text-white" />} 
                    title="Cutting-Edge Technology"
                    className="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30"
                  >
                    Streamline your operations with powerful, easy-to-use tools.
                  </FeatureItem>
                  
                  <FeatureItem 
                    icon={<TrendingUp className="w-6 h-6 text-white" />} 
                    title="Get More Customers"
                    className="bg-gradient-to-br from-green-400 to-cyan-500 shadow-lg shadow-green-500/30"
                  >
                    Connect with more buyers and expand your reach through our powerful online and offline channels.
                  </FeatureItem>

                  <FeatureItem 
                    icon={<Star className="w-6 h-6 text-white" />} 
                    title="Unlock Multiple Revenue Sources"
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30"
                  >
                    Your income isn't limited to your sales. Earn extra revenue from network referrals, commissions, and more.
                  </FeatureItem>
                </div>

                {/* Partner Section */}
                <motion.div variants={itemVariants} className="text-center pt-4">
                  <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">In partnership with</p>
                  <div className="flex justify-center items-center space-x-6">
                    <div className="font-bold text-slate-400 dark:text-slate-500 text-lg">Google</div>
                    <div className="font-bold text-slate-400 dark:text-slate-500 text-lg">Paystack</div>
                    <div className="font-bold text-slate-400 dark:text-slate-500 text-lg">OPay</div>
                  </div>
                </motion.div>

              </motion.div>
            </main>

            <footer className="relative mt-auto flex-shrink-0 p-4">
              {/* Adaptive footer styling */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-900 dark:to-transparent" />
              <div className="relative max-w-md mx-auto">
                <motion.button
                  onClick={onClose}
                  // New button styling: black, rounded-xl
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg dark:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300 ease-in-out"
                  whileTap={{ scale: 0.98 }}
                  variants={itemVariants}
                >
                  Explore My Dashboard
                </motion.button>
              </div>
            </footer>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
