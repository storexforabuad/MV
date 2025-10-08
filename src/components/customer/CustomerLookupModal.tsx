
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader, CheckCircle, MapPin } from "lucide-react";
import { findCustomerByPhone, findOrCreateCustomer } from "@/app/actions/customerActions";
import { Customer, DeliveryAddress } from "@/types/customer";
import { useGeolocation } from "@/hooks/useGeolocation";
import toast from "react-hot-toast";
import Confetti from 'react-confetti';
import { useCustomer } from "@/context/CustomerContext";

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

// A simple component for the new user form
const CreateAccountForm = ({ phoneNumber, onAccountCreated }: { phoneNumber: string, onAccountCreated: (customer: Customer) => void }) => {
    const [name, setName] = useState("");
    const [address, setAddress] = useState<DeliveryAddress>({
        country: "Nigeria",
        state: "Bauchi",
        street: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { loading: geoLoading, error: geoError, data: geoData, getGeolocation } = useGeolocation();

    // Mock reverse geocoding - in a real app, use a service like Google Maps Geocoding API
    const reverseGeocode = async (coords: GeolocationCoordinates) => {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 500)); 
        // In a real implementation, you would make an API call here.
        // For example:
        // const response = await fetch(`https://api.your-geocoder.com/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=...`);
        // const data = await response.json();
        // return data.address.street;
        return `Street near ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
    }

    useEffect(() => {
        if (geoData) {
            toast.promise(
                reverseGeocode(geoData).then(street => {
                    setAddress(prev => ({ ...prev, street }));
                }),
                {
                    loading: 'Getting street address...',
                    success: <b>Address found!</b>,
                    error: <b>Could not find address.</b>,
                }
            );
        }
        if (geoError) {
            toast.error(geoError.message || "Could not get location.");
        }
    }, [geoData, geoError]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !address.street) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await findOrCreateCustomer(phoneNumber, { name, deliveryAddress: address });
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
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-center mb-4">Create Your Account</h2>
            <div className="space-y-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                />
                {/* For a real app, this would be a dropdown */}
                <input
                    type="text"
                    value={address.country}
                    onChange={(e) => setAddress(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                />
                 {/* For a real app, this would be a dropdown of states */}
                <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                />
                <div className="relative">
                     <input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="Street Address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                    />
                    <button type="button" onClick={() => getGeolocation()} disabled={geoLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-500 disabled:opacity-50">
                        {geoLoading ? <Loader className="animate-spin" size={20} /> : <MapPin size={20} />}
                    </button>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white py-3 rounded-lg mt-4 hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
            </div>
        </form>
    )
}

const CustomerLookupModal = ({ isOpen, onClose, onSuccess }: CustomerLookupModalProps) => {
  const [step, setStep] = useState<"PhoneNumberInput" | "AccountLookup" | "WelcomeBack" | "CreateAccount" | "AllDone">("PhoneNumberInput");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setCustomer } = useCustomer();
  
  const handlePhoneNumberSubmit = async () => {
    if (phoneNumber.length < 10) {
        toast.error("Please enter a valid phone number.");
        return;
    }
    
    setIsLoading(true);
    setStep("AccountLookup");

    try {
        const formattedPhoneNumber = `+234${phoneNumber.slice(-10)}`;
        const customer = await findCustomerByPhone(formattedPhoneNumber);
        
        if (customer) {
            setFoundCustomer(customer);
            setStep("WelcomeBack");
        } else {
            setPhoneNumber(formattedPhoneNumber); // Store formatted number for the next step
            setStep("CreateAccount");
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        toast.error(errorMessage);
        setStep("PhoneNumberInput"); // Go back to the input on error
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
      }, 2500);
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
                <h2 className="text-2xl font-bold text-center mb-4">Welcome!</h2>
                <p className="text-center text-gray-600 mb-6">Enter your phone number to continue.</p>
                <div className="flex items-center border-2 border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors">
                    <span className="text-gray-500 mr-2 font-medium">+234</span>
                    <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} // only allow digits
                        className="w-full outline-none border-none bg-transparent" 
                        placeholder="801 234 5678"
                        onKeyDown={(e) => e.key === 'Enter' && handlePhoneNumberSubmit()}
                    />
                </div>
                <button onClick={handlePhoneNumberSubmit} disabled={isLoading} className="w-full bg-blue-500 text-white py-3 rounded-lg mt-4 hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                    {isLoading ? "Please wait..." : "Continue"}
                </button>
            </div>
        );
      case "AccountLookup":
        return (
            <div className="flex flex-col items-center justify-center h-48">
                <Loader className="animate-spin text-blue-500" size={48} />
                <p className="mt-4 text-gray-600">Finding your account...</p>
            </div>
        );
      case "WelcomeBack":
          if (!foundCustomer) return <div>Loading...</div>
          return (
              <div>
                <h2 className="text-2xl font-bold text-center mb-2">Welcome back, {foundCustomer.name}!</h2>
                <div className="text-center bg-gray-100 p-4 rounded-lg my-4">
                    <p className="font-semibold">Your delivery address:</p>
                    <p className="text-gray-700">{foundCustomer.deliveryAddress.street}</p>
                    <p className="text-gray-600">{foundCustomer.deliveryAddress.state}, {foundCustomer.deliveryAddress.country}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => { /* Logic to change address, maybe go to CreateAccount step with prefilled data */ toast('This feature is coming soon!'); }} className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                        Change Address
                    </button>
                    <button onClick={handleWelcomeBackContinue} className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors">
                        Continue
                    </button>
                </div>
              </div>
          )
      case "CreateAccount":
          return <CreateAccountForm phoneNumber={phoneNumber} onAccountCreated={handleAccountCreated} />
      case "AllDone":
          return (
              <div className="flex flex-col items-center justify-center h-48">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                      <CheckCircle className="text-green-500" size={64} />
                  </motion.div>
                  <h2 className="text-2xl font-bold mt-4">You're all set!</h2>
                  <Confetti
                    width={400} // rough estimate of modal width
                    height={300} // rough estimate of modal height
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: "100vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100vh", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden"
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 z-10">
          <X size={24} />
        </button>
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
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
