'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Rocket, Megaphone, Flame, Smartphone, CheckCircle2, Copy, Lightbulb, Eye, Clock, TrendingUp, AlertCircle, Heart, Star, List } from 'lucide-react';
import { Product } from '@/types/product';
import toast from 'react-hot-toast';

interface LaunchGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeLink: string;
  products: Product[];
  storeType?: string;
}

export default function LaunchGuideModal({ isOpen, onClose, storeLink, products, storeType }: LaunchGuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [language, setLanguage] = useState<'en' | 'ha'>('en');
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentSlide]);

  const PHASE_STORAGE_KEY = `launch_playbook_progress_5day_${storeLink || 'store'}`;
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
  const tinyUrl = `https://tinyurl.com/thelinkinmybio/${storeId}`;

  const topProductUrl = topProduct ? `${tinyUrl}/product/${topProduct.id}` : tinyUrl;

  const copies = {
    phase1: {
      en: `I know how frustrating it can be waiting for me to reply to DMs when you just want to place an order. 😩 I've been working on something huge behind the scenes to make shopping with us 10x faster and easier. Can you guess what it is? 👀🔥 We officially go live TOMORROW! 🚀`,
      ha: `Na san yadda abin yake da takaici jiran reply a DM alhali kuna son yin oda ne kawai. 😩 Na kasance ina aikin wani babban abu a ɓoye wanda zai sa yin siyayya da mu ya fi sauri da sauƙi sossai. Ko za ku iya hasashen menene? 👀🔥 InshaAllahu za mu ƙaddamar GOBE! 🚀`,
    },
    phase2: {
      en: `WE ARE LIVE!!! 🛍️✨ You can now see everything we have in stock and check prices instantly!\n\nTo celebrate our grand opening, we are running a massive 10% STOREWIDE PROMO DISCOUNT for the next 24 hours only! Tap here: ${tinyUrl}`,
      ha: `MUN BUDE!!! 🛍️✨ Yanzu za ku iya ganin duk kayan da muke da su da kuma duba farashinsu nan take!\n\nDon murnar bude sabon website dinmu, muna gabatar da babban RAGIN FARASHI NA 10% a kan dukkan kayayyakinmu na tsawon awanni 24 kacal masu zuwa! Danna nan a shiga: ${tinyUrl}`,
    },
    phase3: {
      en: `Wow! I am blown away by the love! 🥺 My WhatsApp is blowing up with neat, organized orders!\n\nThese items have been flying off the shelves 🔥 Order here: ${topProductUrl}`,
      ha: `Wow! Lallai na gamsu da irin wannan ƙauna! 🥺 WhatsApp dina ya cika da oder a tsare gwanin sha'awa! Ina Godiya\n\nWadannan kayayyakin suna ta fita gadan-gadan 🔥 Yi odarku a nan: ${topProductUrl}`,
    },
    phase4: {
      en: `It makes me so happy seeing you guys enjoy the new site! 🥰 For those who haven't tried it yet, it’s super easy. Just click the link, pick what you want, and hit order via Whatsapp! No more waiting for me to be online. Try it yourself: ${tinyUrl}`,
      ha: `Yana sa ni farin ciki sossai ganin yadda kuke jin dadin sabon website dinmu! 🥰 Ga wadanda ba su gwada ba tukuna, abu ne mai sauƙi. Kawai danna link din, zaɓi abin da kuke so, sannan ku tura gami da order zuwa Whatsapp! Ba sai kun jira ina online ba. Gwada da kanku: ${tinyUrl}`,
    },
    phase5: {
      en: `Did you know we have a whole section just for our bestselling categories? 🤩 You don’t need to scroll endlessly anymore. I've organized everything so you can find exactly what you need in seconds. Browse the collection here: ${tinyUrl}`,
      ha: `Shin kun san muna da sashe na musamman don rabe raben kayayyakinmu? 🤩 Ba sai kun sha wahalar neman kaya ba yanzu. Na tsara komai ta yadda za ku iya samun abin da kuke buƙata a cikin daƙiƙa kaɗan. Duba kayayyakin a nan: ${tinyUrl}`,
    },
    phase6: {
      en: `We are open 24/7! 🏪 Did you know you don't even need to ask me if we are available? Save our store link to your phone so you can shop our latest arrivals anytime, anywhere. Thank you for an amazing launch week! ❤️ ${tinyUrl}`,
      ha: `A buɗe muke 24/7! 🏪 Shin kun san ba kwa buƙatar tambayata ko muna available? Ku ajiye link din shagonmu a kan wayarku don ku iya siyan sababbin kayayyakinmu a kowane lokaci, a ko'ina. Mun gode sossai da kuka sanya wannan satin ya zama abin tarihi! ❤️ ${tinyUrl}`,
    }
  };

  const mediaCopies = {
    phase1: {
      en: `Exciting news! 🚀 I've just launched my official booking page. Brands, artists, and businesses—you can now check my promo rates and book me directly without waiting for a DM reply. Link in my bio! 📈`,
      ha: `Sabuwar sanarwa! 🚀 Na bude shafina na musamman don karbar aikin tallace-tallace. Kamfanoni da mawaka, yanzu za ku iya ganin farashina kuma ku biya kai tsaye ba tare da kun jira na yi reply a DM ba. Link din yana a Bio dina! 📈`,
    },
    phase2: {
      en: `Hey! Thanks for reaching out. All my updated promo rates and availability are on my page. You can pick exactly what you need and book it directly here: ${tinyUrl}`,
      ha: `Sannu! Mun gode da tuntuɓarmu. Dukkan sababbin farashina na tallace-tallace suna a shafina. Kuna iya zabar daidai abin da kuke so kuma ku biya kai tsaye a nan: ${tinyUrl}`,
    }
  };

  const standardSlides = [
    {
      id: 'intro',
      icon: Rocket,
      iconColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
      title: 'The 5-Day Launch Playbook',
      description: 'Launch your digital store and build momentum in just 5 days. From uploading products to securing loyal customers.',
      highlights: [
        'Fast-track your setup',
        'Build immediate hype',
        'Open for business 24/7'
      ],
      actionText: 'Start the Guide',
    },
    {
      id: 'phase1',
      icon: CheckCircle2,
      iconColor: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      title: 'Day 1: Setup & Inventory',
      description: 'Before announcing anything, get your digital "shelves" stocked. You don\'t need everything—just your top products to start.',
      tips: [
        'Upload your best 10-20 products',
        'Ensure quality images, precise prices, and accurate stock',
        'Keep the store link private for now'
      ]
    },
    {
      id: 'phase2',
      icon: Lightbulb,
      iconColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
      title: 'Day 1: The Tease',
      description: 'Build anticipation. Tell your audience that a faster, easier way to shop is coming tomorrow.',
      copyText: copies.phase1[language],
      tips: [
        'Post a text-only story on WhatsApp/IG',
        'Show a blurred 2-second sneak peek if possible',
        'Do not share the link yet'
      ]
    },
    {
      id: 'phase3',
      icon: Flame,
      iconColor: 'bg-gradient-to-br from-orange-500 to-red-500',
      title: 'Day 2: Grand Opening',
      description: 'The store is live! Drop the link everywhere and remove all friction to buying. Include a special launch incentive!',
      copyText: copies.phase2[language],
      tips: [
        'Update all social media bios with link',
        'Post a screen-recording showing how to order',
        'Broadcast the link to your WhatsApp lists'
      ]
    },
    {
      id: 'phase4',
      icon: Heart,
      iconColor: 'bg-gradient-to-br from-pink-500 to-rose-600',
      title: 'Day 2: Social Proof & Rush',
      description: 'Prove that people are shopping and highlight the best-selling items from the day.',
      copyText: copies.phase3[language],
      tips: [
        'Post a screenshot of incoming orders',
        'Mention low stock to build urgency',
        'Redirect DMs directly to product/category links (e.g., instead of sending pictures, reply: "See all options here: [Category Link]")'
      ]
    },
    {
      id: 'phase5',
      icon: Star,
      iconColor: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      title: 'Day 3: The "How-To"',
      description: 'Educate latecomers on how easy the new system is, and share early positive feedback to build trust.',
      copyText: copies.phase4[language],
      tips: [
        'Post a screen recording searching and adding to cart',
        'Share a screenshot of a happy customer review',
        'Highlight that they no longer have to wait for your reply'
      ]
    },
    {
      id: 'phase6',
      icon: List,
      iconColor: 'bg-gradient-to-br from-sky-400 to-blue-500',
      title: 'Day 4: Category Spotlight',
      description: 'Drive traffic to specific, high-margin, or complex categories rather than just the home page.',
      copyText: copies.phase5[language],
      tips: [
        'Pick one specific product category (e.g., Perfumes)',
        'Post a carousel showcasing items only from that category',
        'Use the direct Category Link on your status'
      ]
    },
    {
      id: 'phase7',
      icon: Smartphone,
      iconColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
      title: 'Day 5: The "24/7 Store"',
      description: 'Turn launch traffic into returning customers by getting them to install/bookmark the site.',
      copyText: copies.phase6[language],
      tips: [
        'Post a quick tutorial on how to "Add to Home Screen"',
        'Emphasize that they can shop 24/7, even when you are asleep',
        'Celebrate the end of the Launch Week'
      ]
    }
  ];

  const influencerSlides = [
    {
      id: 'intro',
      icon: Rocket,
      iconColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      title: 'Influencer Monetization Playbook',
      description: 'You already have the audience. Complete these plays to turn your DMs into an automated booking machine for promos and services.',
      highlights: [
        'Secure the Link in Bio',
        'Double-Tap shortcuts',
        'Redirect DMs instantly'
      ],
      actionText: 'Start Playbook',
    },
    {
      id: 'phase1',
      icon: Smartphone,
      iconColor: 'bg-gradient-to-br from-pink-500 to-rose-500',
      title: 'Play 1: The Link in Bio',
      description: 'Your bio is prime real estate. Before you announce anything, make sure your store link is permanently placed on your Instagram, TikTok, and X profiles.',
      tips: [
        'Double-tap your main Store Link above to copy it',
        'Paste it in your social media "Website" section',
        'Add a pointing emoji in your bio (e.g., "Book Promos 👇")'
      ]
    },
    {
      id: 'phase2',
      icon: Copy,
      iconColor: 'bg-gradient-to-br from-violet-500 to-purple-600',
      title: 'Play 2: The Double-Tap Shortcut',
      description: 'When brands ask for specific rates, you don\'t need to type them out. Double-tap to instantly copy a direct link to any category or service.',
      tips: [
        'Double-tap "Categories" to send a specific section (e.g., Music Promo)',
        'Double-tap a specific service to send them straight to checkout',
        'This skips the negotiation phase completely'
      ]
    },
    {
      id: 'phase3',
      icon: Megaphone,
      iconColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
      title: 'Play 3: Go Live Announcement',
      description: 'Time to let your audience know you are taking automated bookings. Pin this post or put it on your story.',
      copyText: mediaCopies.phase1[language],
      tips: [
        'Pin the announcement to the top of your profile',
        'Share it to WhatsApp & Snapchat stories',
        'Ensure the "Link in Bio" is clear'
      ]
    },
    {
      id: 'phase4',
      icon: TrendingUp,
      iconColor: 'bg-gradient-to-br from-green-400 to-emerald-500',
      title: 'Play 4: The "Every Post" Rule',
      description: 'People only click what they are reminded of. Mention your store link in the caption of every single post you make.',
      tips: [
        'End captions with: "Link in bio for promos/shoutouts!"',
        'Pin a comment with your store link on your videos',
        'If posting an ad, link directly to that ad\'s category'
      ]
    },
    {
      id: 'phase5',
      icon: List,
      iconColor: 'bg-gradient-to-br from-sky-400 to-blue-500',
      title: 'Play 5: The DM Redirect',
      description: 'When someone DMs asking "How much for a story promo?", don\'t negotiate. Reply with a direct link and tell them to book there.',
      copyText: mediaCopies.phase2[language],
      tips: [
        'Save this message as a "Quick Reply" on your phone',
        'Double-tap to paste the specific service link in the DM',
        'Only start working once you get the Order Notification'
      ]
    }
  ];

  const slides = storeType === 'media-influencer' ? influencerSlides : standardSlides;

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const isSlidePhase = slide.id.startsWith('phase');
  const isPhaseCompleted = isSlidePhase ? completedPhases.includes(slide.id) : true;

  const nextSlide = () => {
    if (isSlidePhase && !isPhaseCompleted) {
      toast.error(language === 'en' ? 'Please mark this phase as complete to continue.' : 'Da fatan za a yi alama a matsayin wanda aka kammala don ci gaba.');
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
    toast.success(language === 'en' ? 'Caption copied!' : 'An kwafi kalaman!');
  };

  const modalVariants = {
    hidden: { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white"
        initial="hidden" animate="visible" exit="exit"
        variants={modalVariants}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* --- Header --- */}
        <header className="flex-shrink-0 flex items-center justify-center w-full border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg z-10 relative">
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto p-4 sm:p-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Launch Guide
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
                Step {currentSlide + 1} of {slides.length}
              </p>
            </div>
            <button
              onClick={() => { onClose(); setTimeout(() => setCurrentSlide(0), 300); }}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:-zinc-700 flex items-center justify-center transition-colors shadow-sm"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            </button>
          </div>
        </header>

        {/* --- Progress Bar --- */}
        <div className="w-full h-1 bg-slate-200 dark:bg-zinc-800">
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

                <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 font-medium leading-relaxed mb-8 max-w-xl">
                  {slide.description}
                </p>

                {/* Language Toggle for Intro Phase */}
                {slide.id === 'intro' && (
                  <div className="flex bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-[1.25rem] mb-10 border border-slate-200 dark:border-zinc-700 mx-auto shadow-inner">
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-8 py-3 rounded-xl font-bold text-[15px] transition-all duration-300 ${language === 'en' ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-violet-400 shadow-md ring-1 ring-slate-900/5 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:-zinc-300'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('ha')}
                      className={`px-8 py-3 rounded-xl font-bold text-[15px] transition-all duration-300 ${language === 'ha' ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-violet-400 shadow-md ring-1 ring-slate-900/5 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:-zinc-300'}`}
                    >
                      Hausa
                    </button>
                  </div>
                )}

                {/* Highlights for Intro */}
                {slide.highlights && (
                  <div className="w-full max-w-md space-y-4 mb-8 text-left bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                    {slide.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={3} />
                        </div>
                        <span className="text-[15px] font-semibold text-slate-700 dark:text-zinc-200 leading-snug">{highlight}</span>
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
                          <span className="text-[14px] font-semibold text-slate-700 dark:text-zinc-300 leading-snug pt-0.5">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy Text Section */}
                {slide.copyText && (
                  <div className="w-full max-w-md text-left">
                    <div className="flex items-center justify-between mb-3 px-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {language === 'en' ? 'Suggested Caption' : 'Kalaman Shawarwari'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(slide.copyText!)}
                        className="text-violet-600 dark:text-violet-400 flex items-center gap-1.5 text-xs font-bold hover:opacity-80 transition-opacity uppercase tracking-wider bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-full"
                      >
                        <Copy className="w-3.5 h-3.5" /> {language === 'en' ? 'Copy' : 'Kwafa'}
                      </button>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                      <p className="text-[13px] font-medium text-slate-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{slide.copyText}</p>
                    </div>
                  </div>
                )}

                {/* Task Completion Section */}
                {isSlidePhase && (
                  <div className="w-full max-w-md mt-6 mb-2">
                    <div className="w-full h-px bg-slate-200 dark:bg-zinc-800 mb-6" />
                    <button
                      onClick={() => togglePhase(slide.id)}
                      className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black text-base sm:text-lg ${completedPhases.includes(slide.id)
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors shrink-0 ${completedPhases.includes(slide.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 dark:border-zinc-600 text-transparent'
                        }`}>
                        <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
                      </div>
                      {completedPhases.includes(slide.id)
                        ? (language === 'en' ? 'Phase Completed!' : 'An Kammala!')
                        : (language === 'en' ? 'Mark as Complete' : 'Kammala Matakin')
                      }
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* --- Footer Controls --- */}
        <footer className="relative flex-shrink-0 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 w-full flex justify-center">
          <div className="max-w-5xl w-full p-4 sm:p-6 flex items-center justify-between">
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex-shrink-0"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={nextSlide}
              disabled={isSlidePhase && !isPhaseCompleted}
              className={`flex-1 ${currentSlide > 0 ? 'ml-4' : ''} ${isSlidePhase && !isPhaseCompleted
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border border-slate-200 dark:border-zinc-700'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]'
                } font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-base outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 w-full`}
            >
              {currentSlide === slides.length - 1
                ? (language === 'en' ? 'Finish Guide' : 'Kammala Jagora')
                : (language === 'en' ? ((slide as any).actionText || 'Continue') : ((slide as any).actionText === 'Start the Guide' ? 'Fara Jagora' : 'Ci gaba'))}
              {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
