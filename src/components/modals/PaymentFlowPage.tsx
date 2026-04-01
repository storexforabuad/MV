'use client';

import { useState } from 'react';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { StoreMeta } from '@/types/store';
import { formatPrice } from '@/utils/price';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { addOrderToFirestore } from '@/app/actions/orderActions';
import { isFoodBeverageProduct } from '@/utils/productHelpers';
import { useCustomer } from '@/context/CustomerContext';
import { findOrCreateCustomer, updateCustomerEmail, findCustomerByEmail } from '@/app/actions/customerActions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/db';
import { geography } from '@/config/geography';

import { CartItem } from '@/lib/cartContext';
import NavigationStore from '@/lib/navigationStore';

interface PaymentFlowPageProps {
  storeMeta: StoreMeta;
  onEvidenceUploaded: (evidenceUrl: string, fileName: string) => void;
  onBack: () => void;
  uploadedEvidence?: { url: string; fileName: string };
  total: number;
  customer: Customer | null;
  deliveryMethod: string;
  orderNotes?: string;
  // For single product
  product?: Product;
  quantity?: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedSpiciness?: string;
  specialInstructions?: string;
  // For cart
  cartItems?: CartItem[];
}

export default function PaymentFlowPage({
  storeMeta,
  onBack,
  total,
  customer: propCustomer, // use prop customer initially, but we might rely on context
  product,
  quantity,
  selectedSize,
  selectedColor,
  selectedSpiciness,
  specialInstructions,
  deliveryMethod,
  orderNotes,
  cartItems
}: PaymentFlowPageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { customer: contextCustomer, setCustomer } = useCustomer();
  const customer = contextCustomer || propCustomer;

  const [showMissingInfoForm, setShowMissingInfoForm] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'email' | 'details'>('email');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const [phoneInput, setPhoneInput] = useState(customer?.phoneNumber || '');
  const [emailInput, setEmailInput] = useState(customer?.email || '');
  const [streetInput, setStreetInput] = useState(customer?.deliveryAddress?.street || '');
  const [stateInput, setStateInput] = useState(customer?.deliveryAddress?.state || 'Bauchi');

  const nigerianStates = geography.find(c => c.name === 'Nigeria')?.states.map(s => s.name) || [];

  const storeId = storeMeta.id || '';

  const needsPhone = !customer?.phoneNumber;
  const needsEmail = !customer?.email;
  const needsAddress = deliveryMethod === 'home' && (!customer?.deliveryAddress?.street || !customer?.deliveryAddress?.state);
  const isMissingInfo = !customer || needsPhone || needsEmail || needsAddress;

  const handleEmailNext = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const existingCustomer = await findCustomerByEmail(emailInput);
      if (existingCustomer) {
        setCustomer(existingCustomer);
        setPhoneInput(existingCustomer.phoneNumber || '');
        setStreetInput(existingCustomer.deliveryAddress?.street || '');
        setStateInput(existingCustomer.deliveryAddress?.state || 'Bauchi');
        toast.success(`Welcome back, ${existingCustomer.name}!`);
      }
      setVerificationStep('details');
    } catch (err) {
      console.error('Email verification error:', err);
      // Even if check fails, let them proceed to enter details manually
      setVerificationStep('details');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleMissingInfoSubmit = async () => {
    if (!phoneInput || !emailInput || (deliveryMethod === 'home' && (!streetInput || !stateInput))) {
      toast.error('Please fill in all required fields to continue.');
      return;
    }

    if (!emailInput.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsProcessing(true);
    let activeCustomer = customer;
    try {
      if (!activeCustomer) {
        // Find or create
        let processedNumber = phoneInput.replace(/\D/g, '');
        if (processedNumber.length === 11 && processedNumber.startsWith('0')) {
          processedNumber = processedNumber.substring(1);
        }
        const formattedPhoneNumber = `+234${processedNumber}`;
        const tempName = `User ${formattedPhoneNumber.slice(-4)}`;

        const result = await findOrCreateCustomer(formattedPhoneNumber, {
          name: tempName,
          email: emailInput,
          deliveryAddress: { country: 'Nigeria', state: stateInput, street: streetInput }
        });
        activeCustomer = result.customer;
        setCustomer(activeCustomer);
      } else {
        // Update existing
        const updates: any = {};
        if (needsEmail && emailInput) updates.email = emailInput;
        // Phone number updates are complex as it's the primary ID sometimes, but if it exists we use it, 
        // if missing (unlikely if they have an account, but possible), we update it.
        if (needsPhone && phoneInput) {
          let processedNumber = phoneInput.replace(/\D/g, '');
          if (processedNumber.length === 11 && processedNumber.startsWith('0')) {
            processedNumber = processedNumber.substring(1);
          }
          updates.phoneNumber = `+234${processedNumber}`;
        }
        if (needsAddress && streetInput && stateInput) {
          updates.deliveryAddress = { country: 'Nigeria', state: stateInput, street: streetInput };
        }

        if (Object.keys(updates).length > 0 && activeCustomer) {
          const customerRef = doc(db, 'customers', activeCustomer.id);
          await updateDoc(customerRef, updates);
          const updatedCustomer = { ...activeCustomer, ...updates };
          setCustomer(updatedCustomer);
          activeCustomer = updatedCustomer;
        }
      }

      // Now trigger Paystack with the fully populated activeCustomer
      if (activeCustomer) {
        await executePaystackPayment(activeCustomer);
      } else {
        throw new Error('Customer information is missing.');
      }
    } catch (err) {
      toast.error('Failed to save details. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePaystackClick = () => {
    if (isMissingInfo) {
      setShowMissingInfoForm(true);
      toast('We need a few more details for escrow protection.', { icon: '🛡️' });
    } else {
      executePaystackPayment(customer!);
    }
  };

  const executePaystackPayment = async (activeCustomer: Customer) => {
    setIsProcessing(true);
    try {
      // 1. Create Pending Order
      let itemsToOrder: any[] = [];

      if (cartItems && cartItems.length > 0) {
        itemsToOrder = cartItems.map(item => ({
          ...item,
          storeId // Ensure storeId is present
        }));
      } else if (product) {
        itemsToOrder = [{
          ...product,
          quantity,
          selectedSize,
          selectedColor,
          selectedSpiciness: isFoodBeverageProduct(product) ? selectedSpiciness : undefined,
          specialInstructions: isFoodBeverageProduct(product) ? specialInstructions : undefined,
          storeId // Ensure storeId is present
        }];
      }

      if (itemsToOrder.length === 0) {
        throw new Error('No items to order');
      }

      const referrerId = localStorage.getItem('referrerId');

      const newOrder = await addOrderToFirestore(
        activeCustomer.id,
        itemsToOrder,
        storeMeta,
        activeCustomer,
        referrerId,
        false, // bonusApplied
        deliveryMethod as 'home' | 'pickup',
        orderNotes || '', // orderNotes
        undefined, // evidenceUrl
        undefined  // evidenceFileName
      );

      if (!newOrder || !newOrder.id) {
        throw new Error('Failed to create order');
      }

      // 2. Initialize Paystack (real or mock based on env)
      const cartSummary = cartItems
        ? `${cartItems.length} items`
        : `${quantity}x ${product?.name}`;

      const isMockMode = process.env.NEXT_PUBLIC_PAYSTACK_MOCK === 'true';
      const endpoint = isMockMode
        ? '/api/paystack/mock-payment'
        : '/api/paystack/initialize-transaction';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeCustomer.email || 'customer@example.com',
          amount: total,
          storeId,
          metadata: {
            orderId: newOrder.id,
            cart_items: cartSummary,
            commission_percent: itemsToOrder[0]?.commission || (itemsToOrder.some(i => i.productType === 'media-influencer' && i.subtype === 'service') ? 10 : 5)
          }
        })
      });

      const data = await response.json();
      if (data.authorization_url) {
        // Save scroll position before redirecting to Paystack
        if (typeof window !== 'undefined') {
          const activeCategory = NavigationStore.getActiveCategory() || 'all';
          NavigationStore.saveScrollPosition(activeCategory, window.scrollY);
        }
        window.location.href = data.authorization_url;
      } else {
        toast.error('Could not initialize payment');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      toast.error('Payment failed to start');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1 transition-colors"
        >
          ← Back to Summary
        </button>

        {/* Digital Receipt Card previously here, removed to avoid redundancy with Page 2 */}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Secure Payment Option */}
        <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-6 border border-green-100 dark:border-green-800/50 shadow-sm">
          <div className="text-[10px] font-extrabold text-green-600 dark:text-green-400 uppercase tracking-widest mb-4">
            Compass 🧭 ESCROW PROTECTION
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Escrow Payment</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">100% Protected Transaction</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-500" /> How our Safe Escrow works:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs">1</span>
                <span className="leading-snug pt-0.5">Your money is held securely by us after payment.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs">2</span>
                <span className="leading-snug pt-0.5">The vendor prepares and delivers your order.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs">3</span>
                <span className="leading-snug pt-0.5">Funds are only released to the vendor when you confirm receipt.</span>
              </li>
            </ul>
          </div>

          {showMissingInfoForm ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-6 border-2 border-green-500 shadow-sm animate-in fade-in slide-in-from-bottom-4 space-y-4 relative">
              <div className="absolute -top-3 left-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Required Details
              </div>

              {verificationStep === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm font-medium focus:border-green-500"
                      autoFocus
                    />
                    <p className="text-[10px] text-gray-400 mt-1">We'll check if you're already registered with us.</p>
                  </div>

                  <button
                    onClick={handleEmailNext}
                    disabled={isVerifyingEmail}
                    className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-base shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isVerifyingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(!customer || needsPhone) && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Phone Number</label>
                      <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">🇳🇬</span>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="0801 234 5678"
                          className="w-full px-3 py-2.5 bg-transparent outline-none text-sm font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {(!customer || needsEmail) && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Email Address (Confirm)</label>
                      <input
                        type="email"
                        value={emailInput}
                        readOnly={!!customer}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="your@email.com"
                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm font-medium focus:border-green-500 ${customer ? 'opacity-70' : ''}`}
                      />
                    </div>
                  )}

                  {(!customer || needsAddress) && deliveryMethod === 'home' && (
                    <div className="space-y-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Delivery Address</label>
                      <select
                        value={stateInput}
                        onChange={(e) => setStateInput(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm font-medium"
                      >
                        {nigerianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={streetInput}
                        onChange={(e) => setStreetInput(e.target.value)}
                        placeholder="Street Address (e.g 123 Main St)"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm font-medium focus:border-green-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setVerificationStep('email')}
                      className="px-4 py-3.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleMissingInfoSubmit}
                      disabled={isProcessing}
                      className="flex-1 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Proceed'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handlePaystackClick}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Pay {formatPrice(total)} Securely</span>
                </>
              )}
            </button>
          )}

          {/* Trust Signals Strip */}
          <div className="mt-6 pt-4 border-t border-green-100 dark:border-green-800/30 flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
              <span className="font-bold text-blue-800 dark:text-blue-400 text-lg italic">Visa</span>
              <span className="font-bold text-red-600 dark:text-red-400 text-lg">Mastercard</span>
              <span className="font-bold text-green-700 dark:text-green-400 text-lg">Verve</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Secured by Paystack</span>
            </div>

            {/* NDPR & Data Privacy Badge */}
            <div className="w-full mt-2 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700/50 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">NDPR Compliant</span>
                </div>
                <div className="w-px h-3 bg-gray-200 dark:bg-gray-600"></div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Data Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
