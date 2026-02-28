'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Rocket, Megaphone, Flame, Smartphone, CheckCircle2, Copy } from 'lucide-react';
import { Product } from '@/types/product';
import toast from 'react-hot-toast';

interface LaunchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeLink: string;
  products: Product[];
  onGoToActionPlan?: () => void;
}

export default function LaunchGuideModal({ isOpen, onClose, storeLink, products, onGoToActionPlan }: LaunchGuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const topProduct = products.length > 0 ? products[0] : null;
  // Get store identifier from storeLink if possible, fallback logic for tinyurl format
  let storeId = 'store';
  try {
      const urlParts = storeLink.split('/');
      storeId = urlParts[urlParts.length - 1];
  } catch (e) {
      if (storeLink) storeId = storeLink;
  }
  const tinyUrl = `https://tinyurl.com/bizconnet/${storeId}`;

  const phase1Copy = `We are upgrading how you shop with us! Something exciting is coming... 🫣📦\n\nNo more waiting hours for me to reply to your DMs before you can order. We are making life easier for you. Guess what it is? 👀`;
  
  const phase2Copy = `🥳 OUR NEW DIGITAL CATALOG IS LIVE!!! 🛍️✨\n\nYou can now see everything we have in stock, check prices, and send your orders straight to my WhatsApp without any stress!\n\nClick here to check it out now 👉 ${tinyUrl}`;
  
  const phase3Copy = topProduct 
    ? `Last chance! 🚨 Our launch promo ends at midnight. If you've been eyeing the ${topProduct.name}, click the link, add it to your cart, and send it to my WhatsApp right now! 🛒💨 👉 ${tinyUrl}/product/${topProduct.id}`
    : `Wow! I love how neat the orders are coming into my WhatsApp! 🥺 Thank you for the love! The launch promo ends tomorrow. Browse the catalog and send in your orders here: ${tinyUrl}`;

  const slides = [
    {
      id: 'intro',
      icon: Rocket,
      iconColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
      title: 'The 3-Day Launch Playbook',
      description: 'Get your first 10-50 orders in 72 hours by following this proven strategy across WhatsApp, Instagram, and Facebook.',
      highlights: [
        'Stop sending loose product pictures',
        'Automate your order collection',
        'Build massive hype before you open'
      ],
      actionText: 'Start the Guide',
    },
    {
      id: 'phase1',
      icon: Megaphone,
      iconColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
      title: 'Day 1: The Tease',
      description: 'Build curiosity! Let your customers know ordering is about to get 10x easier, but DO NOT share the link yet.',
      copyText: phase1Copy,
      tips: [
        'Post a sneak peek on WhatsApp Status & IG Story',
        'Make sure your products and prices are updated',
        'Tease a special launch day offer (e.g., 10% off)'
      ]
    },
    {
      id: 'phase2',
      icon: Flame,
      iconColor: 'bg-gradient-to-br from-orange-500 to-red-500',
      title: 'Day 2: Grand Opening',
      description: 'Drop the link everywhere! Show them exactly how to browse your catalog and checkout smoothly.',
      copyText: phase2Copy,
      tips: [
        'Post your store link on all status/stories',
        'Do a quick screen recording showing how to order',
        'Put the link in your Instagram & TikTok bios!'
      ]
    },
    {
      id: 'phase3',
      icon: Smartphone,
      iconColor: 'bg-gradient-to-br from-sky-400 to-blue-500',
      title: 'Day 3: Social Proof',
      description: "Show that people are actually using the site. This builds trust and encourages those who haven't clicked to try it out.",
      copyText: phase3Copy,
      tips: [
        'Post a screenshot of an order (blur details)',
        'Remind them that the launch promo ends soon',
        'Always redirect DM inquiries to the site link'
      ]
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      if (onGoToActionPlan) {
        onGoToActionPlan();
      } else {
        onClose();
        setTimeout(() => setCurrentSlide(0), 300);
      }
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Caption copied!');
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const modalVariants = { 
    hidden: { opacity: 0, y: '100%' }, 
    visible: { opacity: 1, y: 0 }, 
    exit: { opacity: 0, y: '100%' } 
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
        initial="hidden" animate="visible" exit="exit"
        variants={modalVariants}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* --- Header --- */}
        <header className="flex-shrink-0 flex items-center justify-center w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg z-10 relative">
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Launch Guide
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
              Step {currentSlide + 1} of {slides.length}
            </p>
          </div>
          <button 
            onClick={() => { onClose(); setTimeout(() => setCurrentSlide(0), 300); }} 
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
          </div>
        </header>

        {/* --- Progress Bar --- */}
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800">
          <motion.div 
            className="h-full bg-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* --- Main Scrollable Content --- */}
        <main className="flex-grow w-full mx-auto overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex flex-col justify-start min-h-0 hide-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-full flex-grow flex flex-col items-center pb-24 pt-4 sm:pt-8"
            >
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-3xl ${slide.iconColor} flex items-center justify-center mb-8 shadow-xl shadow-slate-200 dark:shadow-none`}>
                <Icon className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">
                {slide.title}
              </h2>
              
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8 max-w-xl">
                {slide.description}
              </p>

              {/* Highlights for Intro */}
              {slide.highlights && (
                <div className="w-full max-w-md space-y-4 mb-8 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  {slide.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={3} />
                      </div>
                      <span className="text-[15px] font-semibold text-slate-700 dark:text-slate-200 leading-snug">{highlight}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips Section */}
              {slide.tips && (
                <div className="w-full max-w-md text-left bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-3xl p-6 mb-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-5 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Goal Checklist
                  </h4>
                  <div className="space-y-4">
                    {slide.tips.map((tip, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-800/50 flex items-center justify-center shrink-0 text-xs font-black text-violet-700 dark:text-violet-300">
                          {idx + 1}
                        </div>
                        <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 leading-snug pt-0.5">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy Text Section */}
              {slide.copyText && (
                <div className="w-full max-w-md text-left">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Caption</span>
                    <button 
                      onClick={() => copyToClipboard(slide.copyText!)}
                      className="text-violet-600 dark:text-violet-400 flex items-center gap-1.5 text-xs font-bold hover:opacity-80 transition-opacity uppercase tracking-wider bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-full"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{slide.copyText}</p>
                  </div>
                </div>
              )}

              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* --- Footer Controls --- */}
        <footer className="relative flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 w-full flex justify-center">
          <div className="max-w-5xl w-full p-4 sm:p-6 flex items-center justify-between">
            {currentSlide > 0 ? (
              <button
                onClick={prevSlide}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-[66px]" /> // Spacer to keep Next button aligned right if no prev
            )}

            <button
              onClick={nextSlide}
              className="flex-1 ml-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 w-full"
            >
              {currentSlide === slides.length - 1 ? 'Go to Action Plan' : (slide as any).actionText || 'Continue'}
              {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
