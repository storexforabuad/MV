'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import WelcomeScreen, { WelcomeScreenProps } from './screens/WelcomeScreen';
import FeatureScreen, { FeatureScreenProps } from './screens/FeatureScreen';
import { Lightbulb } from 'lucide-react';
import AnimatedDashboardIcons from './AnimatedDashboardIcons';

interface OnboardingFlowProps {
  storeName: string;
  onComplete: () => void;
}

type Step = 
  | { component: 'welcome'; props: Omit<WelcomeScreenProps, 'onNext'> }
  | { component: 'feature'; props: Omit<FeatureScreenProps, 'onNext'> };

const steps = (storeName: string): Step[] => [
    {
      component: 'welcome',
      props: { 
        storeName: storeName,
        showConfetti: true,
      },
    },
    {
      component: 'feature',
      props: {
        icon: <AnimatedDashboardIcons />,
        title: 'Your Toolkit for Success',
        description: 'Your dashboard is packed with powerful tools. From tracking views to managing revenue, everything you need to grow your business is now at your fingertips.',
      },
    },
    {
        component: 'feature',
        props: {
          icon: <Lightbulb className="w-24 h-24 sm:w-32 sm:h-32 text-yellow-400 drop-shadow-lg" />,
          title: 'Ready for Liftoff!',
          description: "You're all set. Your first mission: visit the <strong>'Tips'</strong> card on your dashboard. It's your personal guide to delighting customers and growing your empire.",
          buttonText: 'Enter Command Center',
        },
      },
  ];
  

  const StepContent = ({ step, onNext, storeName }: { step: number; onNext: () => void; storeName: string; }) => {
    const stepConfig = steps(storeName)[step];
  
    if (stepConfig.component === 'welcome') {
      return <WelcomeScreen {...stepConfig.props} onNext={onNext} />;
    }
  
    if (stepConfig.component === 'feature') {
      return <FeatureScreen {...stepConfig.props} onNext={onNext} />;
    }
  
    return null;
  };

export default function OnboardingFlow({ storeName, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const totalSteps = steps(storeName).length;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const variants = {
    enter: {
      opacity: 0,
      y: 30,
      scale: 0.98,
    },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.98,
    },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
      <div className="relative w-full h-full sm:max-w-md sm:max-h-[90vh] sm:rounded-2xl bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="absolute top-3 right-3 z-10">
          <button onClick={onComplete} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <StepContent step={step} onNext={handleNext} storeName={storeName} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-4 flex justify-center space-x-2">
          {steps(storeName).map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-indigo-600 scale-125' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
