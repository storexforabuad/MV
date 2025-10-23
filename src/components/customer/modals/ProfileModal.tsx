'use client';

import { useState } from 'react';
import { X, LogOut, Phone, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { useCustomer } from '@/context/CustomerContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const params = useParams();
  const storeId = typeof params?.storeId === 'string' ? params.storeId : Array.isArray(params?.storeId) ? params.storeId[0] : undefined;
  const { customer } = useCustomer();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = storeId ? `/${storeId}` : '/';
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-slate-800 rounded-t-2xl shadow-lg w-full max-w-2xl h-3/4 absolute bottom-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Your Profile</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="p-6 text-left">
                {customer ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Phone className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {customer.phoneNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {customer.deliveryAddress?.street}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {customer.deliveryAddress?.state}, {customer.deliveryAddress?.country}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    Your profile information will be displayed here.
                  </p>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setShowLogoutConfirmation(true)} 
                  className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-red-600 transition-colors duration-300">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmationDialog
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        confirmButtonText="Logout"
      >
        Are you sure you want to log out?
      </ConfirmationDialog>
    </>
  );
}
