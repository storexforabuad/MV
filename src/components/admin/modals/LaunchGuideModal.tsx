'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Rocket, Megaphone, Flame, Smartphone, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types/product';

interface LaunchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeLink: string;
  products: Product[];
}

const slides = [
  {
    id: 'intro',
    icon: Rocket,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
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
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    title: 'Phase 1: The Tease (48hrs Before)',
    description: 'Build curiosity! Let your customers know ordering is about to get 10x easier, but DO NOT share the link yet.',
    tips: [
      'Post a sneak peek on WhatsApp Status & IG Story',
      'Make sure your products and prices are updated',
      'Tease a special launch day offer (e.g., 10% off)'
    ]
  },
  {
    id: 'phase2',
    icon: Flame,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    title: 'Phase 2: Launch Day Reveal',
    description: 'Drop the link everywhere! Show them exactly how to browse your catalog and checkout smoothly.',
    tips: [
      'Post your store link on all status/stories',
      'Do a quick screen recording showing how to order',
      'Put the link in your Instagram & TikTok bios!'
    ]
  },
  {
    id: 'phase3',
    icon: Smartphone,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    title: 'Phase 3: Social Proof',
    description: "Show that people are actually using the site. This builds trust and encourages those who haven't clicked to try it out.",
    tips: [
      'Post a screenshot of an order (blur details)',
      'Remind them that the launch promo ends soon',
      'Always redirect DM inquiries to the site link'
    ]
  }
];

export default function LaunchGuideModal({ isOpen, onClose, storeLink, products }: LaunchGuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
      // Reset after animation
      setTimeout(() => setCurrentSlide(0), 300);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Progress Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 sm:p-5 flex gap-1 z-10 bg-gradient-to-b from-black/50 to-transparent">
            {slides.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: idx <= currentSlide ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-12 right-4 sm:top-14 sm:right-6 z-20 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="relative pt-20 pb-8 px-6 sm:px-8 min-h-[400px] flex flex-col">
              
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 opacity-20 ${slide.iconBg.split(' ')[0]}`} />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col flex-1"
                >
                  <div className={`w-16 h-16 rounded-2xl ${slide.iconBg} flex items-center justify-center mb-6 shadow-sm`}>
                    <Icon className={`w-8 h-8 ${slide.iconColor}`} />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                    {slide.title}
                  </h2>
                  
                  <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8">
                    {slide.description}
                  </p>

                  {/* Highlights specific to Intro */}
                  {slide.highlights && (
                    <div className="space-y-3 mt-auto">
                      {slide.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tips for subsequent phases */}
                  {slide.tips && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 mt-auto">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" /> Goal Checklist
                      </h4>
                      <div className="space-y-4">
                        {slide.tips.map((tip, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
            {currentSlide > 0 ? (
              <button
                onClick={prevSlide}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-14" /> // Spacer
            )}

            <button
              onClick={nextSlide}
              className="flex-1 ml-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {currentSlide === slides.length - 1 ? 'Go to Action Plan' : (slide as any).actionText || 'Continue'}
              {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
