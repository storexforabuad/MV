'use client';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export interface WelcomeScreenProps {
  onNext: () => void;
  storeName: string;
  showConfetti?: boolean;
}

export default function WelcomeScreen({ onNext, storeName, showConfetti = false }: WelcomeScreenProps) {
  const { width, height } = useWindowSize();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
          Welcome, CEO {storeName}!
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          We&apos;re thrilled you&apos;re here. You&apos;ve just unlocked your personal command center on the Business Science™ platform. This is where your vision takes flight.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
        onClick={onNext}
        className="mt-8 sm:mt-10 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span>Begin Your Journey</span>
        <ArrowRight className="ml-2 h-5 w-5" />
      </motion.button>
    </div>
  );
}
