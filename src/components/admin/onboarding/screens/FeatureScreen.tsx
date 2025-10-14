'use client';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

export interface FeatureScreenProps {
  onNext: () => void;
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonText?: string;
}

export default function FeatureScreen({ onNext, icon, title, description, buttonText = "Next" }: FeatureScreenProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 sm:p-6">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-center mb-6 sm:mb-8"
      >
        {icon}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-sm mx-auto" dangerouslySetInnerHTML={{ __html: description }} />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
        onClick={onNext}
        className="mt-8 sm:mt-10 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span>{buttonText}</span>
        <ArrowRight className="ml-2 h-5 w-5" />
      </motion.button>
    </div>
  );
}
