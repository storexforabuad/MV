
"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader, CheckCircle, MapPin, Search } from "lucide-react";
import { findCustomerByPhone, findOrCreateCustomer } from "@/app/actions/customerActions";
import { Customer, DeliveryAddress } from "@/types/customer";
import toast from "react-hot-toast";
import Confetti from 'react-confetti';
import { useCustomer } from "@/context/CustomerContext";
import { geography } from "@/config/geography";

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

const CreateAccountForm = ({ phoneNumber, onAccountCreated }: { phoneNumber: string, onAccountCreated: (customer: Customer) => void }) => {
    const [address, setAddress] = useState<DeliveryAddress>({
        country: "Nigeria",
        state: "Bauchi",
        street: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const nigerianStates = geography.find(c => c.name === 'Nigeria')?.states.map(s => s.name) || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address.state || !address.street) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const tempName = `User ${phoneNumber.slice(-4)}`;
            const result = await findOrCreateCustomer(phoneNumber, { name: tempName, deliveryAddress: address });
            toast.success("Account created successfully!");
            onAccountCreated(result.customer);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-3xl font-extrabold text-center text-slate-800 dark:text-white">Create Your Account</h2>
            
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select
                    value={address.state}
                    onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                >
                    {nigerianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
            </div>

            <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Street name (e.g G.R.A)"
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl mt-4 hover:bg-slate-900 transition-colors disabled:bg-slate-600 shadow-lg">
                {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
        </form>
    )
}

const CustomerLookupModal = ({ isOpen, onClose, onSuccess }: CustomerLookupModalProps) => {
  const [step, setStep] = useState<"PhoneNumberInput" | "AccountLookup" | "WelcomeBack" | "CreateAccount" | "AllDone">("PhoneNumberInput");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const { setCustomer } = useCustomer();
  
  const handlePhoneNumberSubmit = async () => {
    let processedNumber = phoneNumber.replace(/\D/g, '');

    if (processedNumber.length === 11 && processedNumber.startsWith('0')) {
        processedNumber = processedNumber.substring(1);
    }

    if (processedNumber.length !== 10) {
        toast.error("Please enter a valid 10-digit phone number.");
        return;
    }
    
    setIsLoading(true);
    setStep("AccountLookup");

    try {
        const formattedPhoneNumber = `+234${processedNumber}`;
        const customer = await findCustomerByPhone(formattedPhoneNumber);
        
        if (customer) {
            setFoundCustomer(customer);
            setIsNewUser(false);
            setStep("WelcomeBack");
        } else {
            setPhoneNumber(formattedPhoneNumber);
            setIsNewUser(true);
            setStep("CreateAccount");
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        toast.error(errorMessage);
        setStep("PhoneNumberInput");
    } finally {
        setIsLoading(false);
    }
  };

  const handleAccountCreated = (newCustomer: Customer) => {
      setFoundCustomer(newCustomer);
      setCustomer(newCustomer);
      setStep("AllDone");
      setTimeout(() => {
          onSuccess(newCustomer);
      }, 5000);
  };

  const handleWelcomeBackContinue = () => {
      if(foundCustomer) {
          setCustomer(foundCustomer);
          setStep("AllDone");
          setTimeout(() => {
              onSuccess(foundCustomer);
          }, 2500);
      }
  }

  const resetState = () => {
      setPhoneNumber("");
      setFoundCustomer(null);
      setStep("PhoneNumberInput");
      setIsLoading(false);
      setIsNewUser(false);
  }

  const handleClose = () => {
      resetState();
      onClose();
  }
  
  const renderStep = () => {
    switch (step) {
      case "PhoneNumberInput":
        return (
            <div>
                <h2 className="text-3xl font-extrabold text-center text-slate-800 dark:text-white mb-4">Welcome!</h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Enter your phone number to find or create your account.</p>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                    <span className="text-slate-400 dark:text-slate-500 mr-2 font-medium">🇳🇬 +234</span>
                    <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full outline-none border-none bg-transparent text-slate-800 dark:text-white font-semibold" 
                        placeholder="801 234 5678"
                        onKeyDown={(e) => e.key === 'Enter' && handlePhoneNumberSubmit()}
                    />
                </div>
                <button onClick={handlePhoneNumberSubmit} disabled={isLoading} className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl mt-6 hover:bg-slate-900 transition-colors disabled:bg-slate-600 shadow-lg">
                    {isLoading ? "Please wait..." : "Continue"}
                </button>
            </div>
        );
      case "AccountLookup":
        return (
            <div className="flex flex-col items-center justify-center h-48">
                <Loader className="animate-spin text-purple-500" size={48} />
                <p className="mt-4 text-slate-500 dark:text-slate-400">Finding your account...</p>
            </div>
        );
      case "WelcomeBack":
          if (!foundCustomer) return <div>Loading...</div>
          return (
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Welcome back!</h2>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl my-6">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Your delivery address:</p>
                    <p className="text-slate-600 dark:text-slate-400">{foundCustomer.deliveryAddress.street}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">{foundCustomer.deliveryAddress.state}, {foundCustomer.deliveryAddress.country}</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={handleWelcomeBackContinue} className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl hover:bg-slate-900 transition-colors shadow-lg">
                        Continue
                    </button>
                    <button onClick={() => { setStep("CreateAccount") }} className="w-full bg-transparent text-slate-600 dark:text-slate-300 font-semibold py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Change Address
                    </button>
                </div>
              </div>
          )
      case "CreateAccount":
          return <CreateAccountForm phoneNumber={phoneNumber} onAccountCreated={handleAccountCreated} />
      case "AllDone":
          return (
            <div className="flex flex-col items-center justify-center text-center h-60">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                    <CheckCircle className="text-green-500" size={64} />
                </motion.div>
                {isNewUser ? (
                    <>
                        <h2 className="text-3xl font-bold mt-4 text-slate-800 dark:text-white">Your account has been created!</h2>
                        <p className="text-slate-600 dark:text-slate-300 mt-2">Your referral link is now active. Congrats!</p>
                    </>
                ) : (
                    <h2 className="text-3xl font-bold mt-4 text-slate-800 dark:text-white">You&apos;re all set!</h2>
                )}
                <Confetti
                    width={400}
                    height={300}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.1}
                />
            </div>
        )
      default:
        return <div>Something went wrong. Please try again.</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ y: "10vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "10vh", opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md mx-auto relative overflow-hidden"
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <X size={20} />
        </button>
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerLookupModal;
