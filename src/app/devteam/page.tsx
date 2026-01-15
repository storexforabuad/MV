'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStores, getProducts, getPopularProducts, db } from '../../lib/db';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { StoreMeta } from '../../types/store';
import { getStoreCaption, updateStoreCaption } from '../actions/devActions';
import { resetAllOnboardingStatuses } from '../actions/onboardingActions'; // Import the new server action
import { resetStoreViews } from '../actions/resetViews'; // Import reset views action
import { clearStoreOrders, clearAllCustomerOrders } from '../actions/clearOrders'; // Import clear orders actions
import CategoryManagement from '../../components/CategoryManagement';
import Link from 'next/link';
import { ShoppingBag, ClipboardListIcon, PlusCircle, Save, RefreshCw, Trash2, XCircle, Clock } from 'lucide-react';
import CreateStoreModal from '../../components/admin/modals/CreateStoreModal';
import RegistrationDetailsModal from '../../components/devteam/RegistrationDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import DevTeamReferrals from '../../components/devteam/DevTeamReferrals';
import { DevTeamStoreCard } from '../../components/devteam/DevTeamStoreCard';
import type { SubscriptionStatus } from '../../types/subscription';

interface StoreStats {
  id: string;
  name: string;
  totalProducts: number;
  limitedStock: number;
  soldOut: number;
  popularCount: number;
  totalViews: number;
  rank: number;
}

interface Registration {
  id: string;
  ceoName: string;
  ceoPhone: string;
  ceoEmail: string;
  ceoImageUrl?: string;
  businessName: string;
  businessPhone: string;
  storeType: string;
  subscriptionTier: string;
  amountPaid: number;
  createdAt: any;
}

export default function DevteamPage() {
  const [stores, setStores] = useState<StoreMeta[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [storeStats, setStoreStats] = useState<StoreStats[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoCaption, setPromoCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // State for the reset button
  const [isResettingViews, setIsResettingViews] = useState(false); // State for reset views button
  const [isClearingStoreOrders, setIsClearingStoreOrders] = useState(false); // State for clear store orders
  const [isClearingAllOrders, setIsClearingAllOrders] = useState(false); // State for clear all orders
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionStatus | 'all'>('all'); // Subscription filter
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'registrations' | 'referrals'>('dashboard');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchStores = useCallback(async () => {
    const data = await getStores();
    setStores(data);
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'registrations'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
      setRegistrations(regs);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const storesData = await getStores();
    const statsPromises = storesData.map(async (store) => {
      const products = await getProducts(store.id);
      const popularProducts = await getPopularProducts(store.id, 6);
      const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
      return {
        id: store.id,
        name: store.name,
        totalProducts: products.length,
        limitedStock: products.filter(p => 'limitedStock' in p && p.limitedStock).length,
        soldOut: products.filter(p => 'soldOut' in p && p.soldOut).length,
        popularCount: popularProducts.length,
        totalViews,
        rank: 0, // will be set after sorting
      };
    });
    const stats = await Promise.all(statsPromises);
    stats.sort((a, b) => b.totalViews - a.totalViews);
    stats.forEach((s, i) => s.rank = i + 1);
    setStoreStats(stats);
  }, []);

  useEffect(() => {
    fetchStores();
    fetchStats();
    fetchRegistrations();
  }, [fetchStores, fetchStats, fetchRegistrations]);

  useEffect(() => {
    if (selectedStore) {
      getStoreCaption(selectedStore).then(caption => {
        setPromoCaption(caption || '');
      });
    } else {
      setPromoCaption('');
    }
  }, [selectedStore]);

  const handleSaveCaption = async () => {
    if (selectedStore) {
      setIsSaving(true);
      await updateStoreCaption(selectedStore, promoCaption);
      setIsSaving(false);
      alert('Caption saved!');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedRegistration(undefined);
    // Refresh data after modal closes, in case a new store was added
    fetchStores();
    fetchStats();
    fetchRegistrations();
  }

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    const result = await resetAllOnboardingStatuses();
    setIsResetting(false);
    alert(result.message);
  };

  const handleResetViews = async () => {
    const confirmed = confirm('⚠️ Are you sure you want to reset ALL views for supermom-ng store? This cannot be undone!');
    if (!confirmed) return;

    setIsResettingViews(true);
    try {
      const result = await resetStoreViews('supermom-ng');
      alert(`✅ Successfully reset views!\n\n- ${result.productsUpdated} products updated\n- ${result.metricsDeleted} metrics deleted`);
      // Refresh stats to show updated view counts
      fetchStats();
    } catch (error) {
      alert('❌ Failed to reset views. Check console for details.');
      console.error(error);
    } finally {
      setIsResettingViews(false);
    }
  };

  const handleClearStoreOrders = async () => {
    const confirmed = confirm('⚠️ DANGER: Are you sure you want to DELETE ALL orders for supermom-ng store?\n\nThis will:\n- Delete all store orders\n- Delete all customer orders for this store\n- Reset store stats\n\nThis CANNOT be undone!');
    if (!confirmed) return;

    setIsClearingStoreOrders(true);
    try {
      const result = await clearStoreOrders('supermom-ng');
      alert(`✅ Successfully deleted orders!\n\n- ${result.storeOrdersDeleted} store orders deleted\n- ${result.customerOrdersDeleted} customer orders deleted`);
      fetchStats();
    } catch (error) {
      alert('❌ Failed to delete orders. Check console for details.');
      console.error(error);
    } finally {
      setIsClearingStoreOrders(false);
    }
  };

  const handleClearAllOrders = async () => {
    const confirmed = confirm('🚨 EXTREME DANGER 🚨\n\nAre you ABSOLUTELY SURE you want to DELETE ALL ORDERS from ALL CUSTOMERS on the ENTIRE PLATFORM?\n\nThis is IRREVERSIBLE and will affect ALL stores!\n\nType "DELETE ALL ORDERS" in the next prompt to confirm.');
    if (!confirmed) return;

    const doubleConfirm = prompt('Type exactly: DELETE ALL ORDERS');
    if (doubleConfirm !== 'DELETE ALL ORDERS') {
      alert('Cancelled. Text did not match.');
      return;
    }

    setIsClearingAllOrders(true);
    try {
      const result = await clearAllCustomerOrders();
      alert(`✅ All orders deleted!\n\n- ${result.customersProcessed} customers processed\n- ${result.totalOrdersDeleted} total orders deleted`);
      fetchStats();
    } catch (error) {
      alert('❌ Failed to delete all orders. Check console for details.');
      console.error(error);
    } finally {
      setIsClearingAllOrders(false);
    }
  };

  const selectedStoreMeta = stores.find(s => s.id === selectedStore);
  const selectedStoreStats = storeStats.find(s => s.id === selectedStore);

  return (
    <>
      <CreateStoreModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialData={selectedRegistration}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-2 py-4 pt-[calc(var(--navbar-height,64px)+1.5rem)] pb-24">
        <header className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">DevTeam Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Manage stores, categories, and view live stats.
          </p>
        </header>

        <div className="max-w-5xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 w-fit mx-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'admin'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              Admin
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'registrations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              Registrations
              {registrations.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {registrations.length}
                </span>
              )}
            </button>
          </div>

          {/* --- DASHBOARD TAB --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add New Store
                </button>

                <button
                  onClick={handleResetOnboarding}
                  disabled={isResetting}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-red-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
                  {isResetting ? 'Resetting...' : 'Reset All Onboarding'}
                </button>
                <button
                  onClick={handleResetViews}
                  disabled={isResettingViews}
                  className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 className={`w-5 h-5 ${isResettingViews ? 'animate-spin' : ''}`} />
                  {isResettingViews ? 'Resetting Views...' : 'Reset Supermom Views'}
                </button>
                <button
                  onClick={handleClearStoreOrders}
                  disabled={isClearingStoreOrders}
                  className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-rose-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <XCircle className={`w-5 h-5 ${isClearingStoreOrders ? 'animate-spin' : ''}`} />
                  {isClearingStoreOrders ? 'Clearing...' : 'Clear Supermom Orders'}
                </button>
                <button
                  onClick={handleClearAllOrders}
                  disabled={isClearingAllOrders}
                  className="flex items-center gap-2 bg-red-900 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-red-950 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-red-500"
                >
                  <XCircle className={`w-5 h-5 ${isClearingAllOrders ? 'animate-spin' : ''}`} />
                  {isClearingAllOrders ? 'Clearing...' : '🚨 Clear ALL Orders'}
                </button>
              </div>

              <section>
                <DevTeamReferrals />
              </section>
            </div>
          )}

          {/* --- ADMIN TAB --- */}
          {activeTab === 'admin' && (
            <div className="space-y-8 animate-fade-in">
              {/* Subscription Management Section */}
              <section>
                <div className="flex flex-col items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Vendor Subscriptions</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Monitor and manage subscription status for all vendors
                  </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <button
                    onClick={() => setSubscriptionFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subscriptionFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    All Stores ({stores.length})
                  </button>
                  <button
                    onClick={() => setSubscriptionFilter('trial')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subscriptionFilter === 'trial'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    🔵 Trial ({stores.filter(s => (s.subscriptionStatus || 'trial') === 'trial').length})
                  </button>
                  <button
                    onClick={() => setSubscriptionFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subscriptionFilter === 'active'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    🟢 Active ({stores.filter(s => s.subscriptionStatus === 'active').length})
                  </button>
                  <button
                    onClick={() => setSubscriptionFilter('past_due')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subscriptionFilter === 'past_due'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    🟡 Past Due ({stores.filter(s => s.subscriptionStatus === 'past_due').length})
                  </button>
                  <button
                    onClick={() => setSubscriptionFilter('expired')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subscriptionFilter === 'expired'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    🔴 Expired ({stores.filter(s => s.subscriptionStatus === 'expired').length})
                  </button>
                  <button
                    onClick={() => setSubscriptionFilter('cancelled')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${subscriptionFilter === 'cancelled'
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    ⚫ Cancelled ({stores.filter(s => s.subscriptionStatus === 'cancelled').length})
                  </button>
                </div>

                {/* Store Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores
                    .filter(store =>
                      subscriptionFilter === 'all' ||
                      (store.subscriptionStatus || 'trial') === subscriptionFilter
                    )
                    .map(store => (
                      <DevTeamStoreCard
                        key={store.id}
                        storeId={store.id}
                        storeName={store.name}
                        logo={store.logo}
                        subscriptionStatus={store.subscriptionStatus || 'trial'}
                        subscriptionTrialEndsAt={store.subscriptionTrialEndsAt}
                        subscriptionNextBillingDate={store.subscriptionNextBillingDate}
                        ceoEmail={store.ceoEmail}
                        ceoName={store.ceoName}
                      />
                    ))}
                </div>
              </section>

              <section className="mb-6 border-t border-gray-200 dark:border-gray-800 pt-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">Select a Store to Manage</label>
                <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto p-2 border border-gray-100 dark:border-gray-800 rounded-xl">
                  {stores.map((store: StoreMeta) => (
                    <button
                      key={store.id}
                      className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedStore === store.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      onClick={() => setSelectedStore(store.id)}
                    >
                      {store.name}
                    </button>
                  ))}
                </div>
              </section>

              {selectedStore && selectedStoreMeta && selectedStoreStats && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-lg text-blue-700 dark:text-blue-300">{selectedStoreStats.name}</h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{selectedStoreStats.id}</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {(() => {
                      const isSports = selectedStoreMeta && (selectedStoreMeta.storeType === 'sports' || selectedStoreMeta.storeType === 'pitchperfect' || selectedStoreMeta.storeType === 'pitch');
                      const adminHref = isSports ? `/admin/sports/${selectedStoreStats.id}` : `/admin/${selectedStoreStats.id}`;
                      const liveHref = isSports ? `/sports/${selectedStoreStats.id}` : `/${selectedStoreStats.id}`;
                      return (
                        <>
                          <a href={adminHref} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition">Admin Panel</a>
                          <a href={liveHref} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition">Live Store</a>
                        </>
                      )
                    })()}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg"><span className="font-bold text-blue-800 dark:text-blue-200">{selectedStoreStats.totalProducts}</span><p className="text-xs text-blue-600 dark:text-blue-300">Products</p></div>
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg"><span className="font-bold text-yellow-800 dark:text-yellow-200">{selectedStoreStats.limitedStock}</span><p className="text-xs text-yellow-600 dark:text-yellow-300">Limited</p></div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/50 rounded-lg"><span className="font-bold text-red-800 dark:text-red-200">{selectedStoreStats.soldOut}</span><p className="text-xs text-red-600 dark:text-red-300">Sold Out</p></div>
                    <div className="p-2 bg-green-50 dark:bg-green-900/50 rounded-lg"><span className="font-bold text-green-800 dark:text-green-200">{selectedStoreStats.popularCount}</span><p className="text-xs text-green-600 dark:text-green-300">Popular</p></div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/50 rounded-lg"><span className="font-bold text-purple-800 dark:text-purple-200">{selectedStoreStats.totalViews.toLocaleString()}</span><p className="text-xs text-purple-600 dark:text-purple-300">Views</p></div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><span className="font-bold text-gray-800 dark:text-gray-200">#{selectedStoreStats.rank}</span><p className="text-xs text-gray-600 dark:text-gray-400">Rank</p></div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-2">Promo Caption</h3>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
                      rows={3}
                      value={promoCaption}
                      onChange={(e) => setPromoCaption(e.target.value)}
                      placeholder="Enter a promotional caption for this store's share link..."
                    />
                    <button
                      onClick={handleSaveCaption}
                      disabled={isSaving}
                      className="mt-2 flex items-center justify-center gap-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Caption
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-4">
                    <CategoryManagement storeId={selectedStore} />
                  </div>
                </motion.section>
              )}
            </div>
          )}

          {/* --- REGISTRATIONS TAB --- */}
          {activeTab === 'registrations' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Pending Registrations
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm('Add mock registrations?')) return;
                      const mockData = [
                        {
                          businessName: 'Golden Spoon Restaurant',
                          ceoName: 'Chioma Okonkwo',
                          ceoPhone: '08012345678',
                          ceoEmail: 'chioma@goldenspoon.com',
                          storeType: 'restaurant',
                          subscriptionTier: 'pro',
                          amountPaid: 5000,
                          status: 'pending',
                          paymentReference: 'ref_mock_' + Date.now() + '_1'
                        },
                        {
                          businessName: 'Urban Threads',
                          ceoName: 'Emmanuel Adebayo',
                          ceoPhone: '08098765432',
                          ceoEmail: 'emmanuel@urbanthreads.ng',
                          storeType: 'fashion',
                          subscriptionTier: 'promax',
                          amountPaid: 15000,
                          status: 'pending',
                          paymentReference: 'ref_mock_' + Date.now() + '_2'
                        },
                        {
                          businessName: 'Tech Haven',
                          ceoName: 'David Ibrahim',
                          ceoPhone: '07055555555',
                          ceoEmail: 'david@techhaven.com',
                          storeType: 'general',
                          subscriptionTier: 'basic',
                          amountPaid: 2000,
                          status: 'pending',
                          paymentReference: 'ref_mock_' + Date.now() + '_3'
                        }
                      ];

                      try {
                        for (const data of mockData) {
                          await addDoc(collection(db, 'registrations'), {
                            ...data,
                            createdAt: serverTimestamp()
                          });
                        }
                        alert('Mock data added successfully!');
                        fetchRegistrations();
                      } catch (e: any) {
                        console.error('Error adding mock data:', e);
                        alert('Error adding mock data: ' + e.message);
                      }
                    }}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-purple-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Seed Mock Data
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Manual Create
                  </button>
                </div>
              </div>

              {registrations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardListIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Pending Registrations</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    New vendor registrations will appear here. You can also create a store manually.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-emerald-500 flex flex-col justify-between hover:shadow-xl transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{reg.businessName}</h3>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">
                            {reg.subscriptionTier} Plan
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">CEO: <span className="font-medium text-gray-700 dark:text-gray-300">{reg.ceoName}</span></p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Type: <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{reg.storeType}</span></p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                          <Clock className="w-3 h-3" />
                          <span>{reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRegistration(reg);
                          setIsDetailsModalOpen(true);
                        }}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- REFERRALS TAB --- */}
          {activeTab === 'referrals' && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <DevTeamReferrals />
            </motion.div>
          )}

        </div>

        {/* Mobile Bottom Nav (Optional, if you want to keep it or replace with tabs) */}
        <nav className="fixed bottom-0 left-0 w-full z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg flex sm:hidden justify-around py-2">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center text-xs font-semibold ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <ShoppingBag className="w-6 h-6 mb-1" />
            Dashboard
          </button>
          <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center text-xs font-semibold ${activeTab === 'admin' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <ClipboardListIcon className="w-6 h-6 mb-1" />
            Admin
          </button>
          <button onClick={() => setActiveTab('registrations')} className={`flex flex-col items-center text-xs font-semibold ${activeTab === 'registrations' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <PlusCircle className="w-6 h-6 mb-1" />
            Regs
          </button>
        </nav>
      </div >

      {/* Registration Details Modal */}
      <RegistrationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        registration={selectedRegistration}
        onCreateStore={(reg) => {
          setIsDetailsModalOpen(false);
          setIsModalOpen(true);
        }}
      />
    </>
  );
}
