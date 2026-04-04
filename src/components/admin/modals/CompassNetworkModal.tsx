'use client';

import { Zap, TrendingUp, Star, Globe, Sparkles, Building2, CreditCard, Smartphone } from 'lucide-react';
import { AnimatePresence, motion, Variants } from 'framer-motion';

interface CompassNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeType?: string;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.4 } },
};

// Reusable Card Component matching TipsModal style
const FeatureCard = ({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  proTip
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  proTip?: string;
}) => (
  <motion.div
    variants={itemVariants}
    className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-200"
  >
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base text-gray-800 dark:text-white mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
    {proTip && (
      <div className="ml-13 pl-3 border-l-2 border-blue-400 dark:border-blue-500">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            <span className="font-bold">Did you know?</span> {proTip}
          </p>
        </div>
      </div>
    )}
  </motion.div>
);

export const CompassNetworkModal = ({ isOpen, onClose, storeType }: CompassNetworkModalProps) => {
  const isInfluencer = storeType === 'media-influencer';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100vh' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100vh' }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-900"
        >
          {/* Decorative gradient background */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-br from-blue-50 via-purple-50/30 to-white dark:from-blue-900/10 dark:via-purple-900/5 dark:to-slate-900 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  Compass 🧭 App
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Built for {isInfluencer ? 'Creators' : 'Vendors'}, by {isInfluencer ? 'Creators' : 'Vendors'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
              <motion.div
                className="max-w-3xl mx-auto space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <FeatureCard
                  icon={Zap}
                  iconColor="text-purple-500"
                  iconBg="bg-purple-100 dark:bg-purple-900/30"
                  title={isInfluencer ? "Creator-Focused Technology" : "Cutting-Edge Technology"}
                  description={isInfluencer ? "Streamline your content business with powerful, easy-to-use tools designed for both services and physical commerce." : "Streamline your operations with powerful, easy-to-use tools designed specifically for modern commerce."}
                />

                <FeatureCard
                  icon={TrendingUp}
                  iconColor="text-emerald-500"
                  iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                  title={isInfluencer ? "Expand Your Reach" : "Get More Customers"}
                  description={isInfluencer ? "Connect with brands for high-value collabs and expand your influence through our professional marketplace channels." : "Connect with more buyers and expand your reach through our powerful online and offline channels."}
                  proTip={isInfluencer ? "Join our exclusive creator workshops and pop-up events organized by Compass 🧭 to showcase your personal brand directly to the community!" : "Join our exclusive events including Funfairs, Trade Fairs, and Pop-ups organized by Compass 🧭 to showcase your products directly to customers!"}
                />

                <FeatureCard
                  icon={Star}
                  iconColor="text-amber-500"
                  iconBg="bg-amber-100 dark:bg-amber-900/30"
                  title={isInfluencer ? "Infinite Revenue Streams" : "Unlock Multiple Revenue Sources"}
                  description={isInfluencer ? "Don't limit yourself. Monetize every aspect of your influence, from PR services and digital shoutouts to physical merch and collections." : "Your income isn't limited to your sales. Earn extra revenue from network referrals, commissions, and more."}
                />

                {/* Partners Section */}
                <motion.div variants={itemVariants} className="pt-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-center text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                      Trusted Partners
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-lg">
                        <Building2 className="w-5 h-5" /> Google
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-lg">
                        <CreditCard className="w-5 h-5" /> Paystack
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-lg">
                        <Smartphone className="w-5 h-5" /> OPay
                      </div>
                    </div>
                  </div>
                </motion.div>

              </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative mt-auto flex-shrink-0 p-4 sm:p-5 border-t border-gray-200 dark:border-slate-700">
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-slate-900 dark:to-transparent pointer-events-none" />
              <div className="relative max-w-3xl mx-auto">
                <motion.button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  whileTap={{ scale: 0.98 }}
                >
                  Explore My {isInfluencer ? 'Hub' : 'Dashboard'}
                </motion.button>
              </div>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
