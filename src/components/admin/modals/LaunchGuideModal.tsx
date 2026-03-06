'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Rocket, Megaphone, Flame, Smartphone, CheckCircle2, Copy, Lightbulb, Eye, Clock, TrendingUp, AlertCircle, Heart } from 'lucide-react';
import { Product } from '@/types/product';
import toast from 'react-hot-toast';

interface LaunchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeLink: string;
  products: Product[];
}

export default function LaunchGuideModal({ isOpen, onClose, storeLink, products }: LaunchGuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentSlide]);

  const PHASE_STORAGE_KEY = `launch_playbook_progress_7day_${storeLink || 'store'}`;
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(PHASE_STORAGE_KEY);
        if (saved) {
          setCompletedPhases(JSON.parse(saved));
        }
      }
    } catch (e) {
      console.error('Error loading playbook progress', e);
    }
  }, [PHASE_STORAGE_KEY]);

  const togglePhase = (phaseId: string) => {
    setCompletedPhases(prev => {
      const isCompleted = prev.includes(phaseId);
      const newPhases = isCompleted
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId];

      try {
        localStorage.setItem(PHASE_STORAGE_KEY, JSON.stringify(newPhases));
      } catch (e) {
        console.error('Error saving playbook progress', e);
      }
      return newPhases;
    });
  };

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

  const phase1Copy = `I know how frustrating it can be waiting for me to reply to DMs when you just want to place an order. 😩 I've been working on something huge behind the scenes to make shopping with us 10x faster and easier. Can you guess what it is? 👀🔥`;

  const phase2Copy = `You guys guessed it! We are finally moving to a fully digital catalog! 🥳 No more scrolling through hundreds of pictures or waiting for prices. I’m loading up all the products right now. We officially go live in 2 days! 🚀`;

  const phase3Copy = `TOMORROW IS THE DAY! ⏰ Our new digital store opens in exactly 24 hours. To celebrate, I’m doing something crazy—the first 10 people to order through the new site tomorrow will get a special gift/discount! Set your alarms! 🎁💨`;

  const phase4Copy = `WE ARE LIVE!!! 🛍️✨ You can now see everything we have in stock, check prices, and send your orders straight to my WhatsApp in seconds!\n\nThe Launch Promo is officially active. Click here to check it out now 👉 ${tinyUrl}`;

  const phase5Copy = `Wow! I am blown away by the love! 🥺 My WhatsApp is blowing up with neat, organized orders. Thank you to everyone who has shopped via the new link! If you haven't checked it out yet, what are you waiting for? 👉 ${tinyUrl}`;

  const topProductUrl = topProduct ? `${tinyUrl}/product/${topProduct.id}` : tinyUrl;
  const phase6Copy = `These 3 items have been flying off the shelves since we launched the new site! 📦🔥 We only have a few left in stock. Also, reminder: Our special launch promo ends TOMORROW night! Don't miss out. Order directly here: ${topProductUrl}`;

  const phase7Copy = `Last chance! 🚨 Our official launch promo ends at midnight tonight! If you've been eyeing anything, now is the time to click the link, add it to your cart, and send it in! Thank you for an amazing opening week! 🛒💨 👉 ${tinyUrl}`;

  const slides = [
    {
      id: 'intro',
      icon: Rocket,
      iconColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
      title: 'The 7-Day Launch Playbook',
      description: 'Get your first 10-50 orders in a week by following this proven strategy across WhatsApp, Instagram, and Facebook.',
      highlights: [
        'Stop sending loose product pictures',
        'Automate your order collection',
        'Build massive hype before you open'
      ],
      actionText: 'Start the Guide',
    },
    {
      id: 'phase1',
      icon: Lightbulb,
      iconColor: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      title: 'Day 1: The Hook',
      description: 'Address the current pain points of ordering and announce that a massive upgrade is coming.',
      copyText: phase1Copy,
      tips: [
        'Post a text-only story on WhatsApp/IG',
        'Ask an engaging question about waiting times',
        'Do not mention the website yet'
      ]
    },
    {
      id: 'phase2',
      icon: Eye,
      iconColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
      title: 'Day 2: Sneak Peek',
      description: 'Validate their guesses and show a blurred or quick behind-the-scenes look at you setting up the digital catalog.',
      copyText: phase2Copy,
      tips: [
        'Show a quick 2-second boomerang of your screen',
        'Make sure your products/inventory are updated',
        'Announce the exact launch date'
      ]
    },
    {
      id: 'phase3',
      icon: Clock,
      iconColor: 'bg-gradient-to-br from-pink-400 to-rose-500',
      title: 'Day 3: The Countdown',
      description: 'Build high urgency. Announce that the store goes live tomorrow and tease a special launch-day promo.',
      copyText: phase3Copy,
      tips: [
        'Post a countdown sticker on IG Stories',
        'Tease a "Launch Day Only" discount',
        'Tell them to turn on post notifications'
      ]
    },
    {
      id: 'phase4',
      icon: Flame,
      iconColor: 'bg-gradient-to-br from-orange-500 to-red-500',
      title: 'Day 4: Grand Opening',
      description: 'The store is live! Drop the link everywhere and remove all friction to buying.',
      copyText: phase4Copy,
      tips: [
        'Update all social media bios with link',
        'Post a screen-recording showing how to order',
        'Broadcast the link to your WhatsApp lists'
      ]
    },
    {
      id: 'phase5',
      icon: Heart,
      iconColor: 'bg-gradient-to-br from-sky-400 to-blue-500',
      title: 'Day 5: Social Proof',
      description: 'Show that people are actively using the site to build trust and convert skeptics.',
      copyText: phase5Copy,
      tips: [
        'Post a screenshot of incoming orders',
        'Share a review or reaction from a customer',
        'Redirect all new inquiries to the site link'
      ]
    },
    {
      id: 'phase6',
      icon: TrendingUp,
      iconColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
      title: 'Day 6: Spotlight',
      description: 'Highlight the best-selling items from the last 48 hours to create product-specific FOMO.',
      copyText: phase6Copy,
      tips: [
        'Post a carousel/video of top 3 bestsellers',
        'Mention low stock on popular items',
        'Remind them promo ends tomorrow'
      ]
    },
    {
      id: 'phase7',
      icon: AlertCircle,
      iconColor: 'bg-gradient-to-br from-fuchsia-500 to-pink-600',
      title: 'Day 7: Last Call',
      description: 'The absolute final push. Create high urgency as the launch window and promotional offers close.',
      copyText: phase7Copy,
      tips: [
        'Post a "Last Chance" graphic',
        'Send a final broadcast message 6 hours before close',
        'Celebrate the successful launch week'
      ]
    }
  ];

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const isSlidePhase = slide.id.startsWith('phase');
  const isPhaseCompleted = isSlidePhase ? completedPhases.includes(slide.id) : true;

  const nextSlide = () => {
    if (isSlidePhase && !isPhaseCompleted) {
      toast.error('Please mark this phase as complete to continue.');
      return;
    }
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
      setTimeout(() => setCurrentSlide(0), 300);
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
        <main ref={scrollRef} className="flex-grow w-full mx-auto overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex flex-col justify-start min-h-0 hide-scrollbar scroll-smooth">
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

                {/* Task Completion Section */}
                {isSlidePhase && (
                  <div className="w-full max-w-md mt-6 mb-2">
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-6" />
                    <button
                      onClick={() => togglePhase(slide.id)}
                      className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black text-base sm:text-lg ${completedPhases.includes(slide.id)
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors shrink-0 ${completedPhases.includes(slide.id)
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-transparent'
                        }`}>
                        <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
                      </div>
                      {completedPhases.includes(slide.id) ? 'Phase Completed!' : 'Mark as Complete'}
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* --- Footer Controls --- */}
        <footer className="relative flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 w-full flex justify-center">
          <div className="max-w-5xl w-full p-4 sm:p-6 flex items-center justify-between">
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex-shrink-0"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={nextSlide}
              disabled={isSlidePhase && !isPhaseCompleted}
              className={`flex-1 ${currentSlide > 0 ? 'ml-4' : ''} ${isSlidePhase && !isPhaseCompleted
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]'
                } font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-base outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 w-full`}
            >
              {currentSlide === slides.length - 1 ? 'Finish Guide' : (slide as any).actionText || 'Continue'}
              {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
