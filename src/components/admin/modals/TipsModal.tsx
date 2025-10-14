'use client';
import { X, Lightbulb, Navigation, ShoppingBag, BarChart2 } from 'lucide-react';
import Modal from './Modal'; // Import the generic Modal

interface TipsModalProps {
  handleClose: () => void;
}

export default function TipsModal({ handleClose }: TipsModalProps) {
  return (
    <Modal onClose={handleClose}>
      <div className="w-full p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <Lightbulb className="w-6 h-6 mr-3 text-yellow-500" />
            App Tips & Tricks
          </h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-semibold text-md sm:text-lg text-gray-800 dark:text-white flex items-center mb-1">
              <Navigation className="w-5 h-5 mr-2 text-sky-500" />
              Navigating the App
            </h3>
            <p className="text-sm sm:text-base">
              Use the tabs at the bottom to quickly switch between your Dashboard, Products, Orders, and Store sections.
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-semibold text-md sm:text-lg text-gray-800 dark:text-white flex items-center mb-1">
              <BarChart2 className="w-5 h-5 mr-2 text-green-500" />
              Quick Stats
            </h3>
            <p className="text-sm sm:text-base">
              Tap on cards like &apos;Views&apos;, &apos;Products&apos;, or &apos;Revenue&apos; to see more detailed information and analytics.
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <h3 className="font-semibold text-md sm:text-lg text-gray-800 dark:text-white flex items-center mb-1">
              <ShoppingBag className="w-5 h-5 mr-2 text-pink-500" />
              Product Management
            </h3>
            <p className="text-sm sm:text-base">
              Tapping the &apos;Popular&apos;, &apos;Limited&apos;, or &apos;Sold Out&apos; cards will take you directly to a filtered list of those products.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Got it!
          </button>
        </div>
      </div>
    </Modal>
  );
}
