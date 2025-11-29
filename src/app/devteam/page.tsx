'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStores, getProducts, getPopularProducts } from '../../lib/db';
import { StoreMeta } from '../../types/store';
import { getStoreCaption, updateStoreCaption } from '../actions/devActions';
import { resetAllOnboardingStatuses } from '../actions/onboardingActions'; // Import the new server action
import CategoryManagement from '../../components/CategoryManagement';
import Link from 'next/link';
import { ShoppingBag, ClipboardListIcon, PlusCircle, Save, RefreshCw } from 'lucide-react';
import CreateStoreModal from '../../components/admin/modals/CreateStoreModal';
import { motion } from 'framer-motion';
import DevTeamReferrals from '../../components/devteam/DevTeamReferrals';

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

export default function DevteamPage() {
  const [stores, setStores] = useState<StoreMeta[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [storeStats, setStoreStats] = useState<StoreStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoCaption, setPromoCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // State for the reset button

  const fetchStores = useCallback(async () => {
    const data = await getStores();
    setStores(data);
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
  }, [fetchStores, fetchStats]);

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
    // Refresh data after modal closes, in case a new store was added
    fetchStores();
    fetchStats();
  }

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    const result = await resetAllOnboardingStatuses();
    setIsResetting(false);
    alert(result.message);
  };

  const selectedStoreMeta = stores.find(s => s.id === selectedStore);
  const selectedStoreStats = storeStats.find(s => s.id === selectedStore);

  return (
    <>
      <CreateStoreModal isOpen={isModalOpen} onClose={handleModalClose} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-2 py-4 pt-[calc(var(--navbar-height,64px)+1.5rem)]">
        <header className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">DevTeam Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Manage stores, categories, and view live stats.
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-4 mb-6">
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
          </div>

          <section className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">Select a Store to Manage</label>
            <div className="flex flex-wrap gap-2 justify-center">
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
                <a href={`/admin/${selectedStoreStats.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition">Admin Panel</a>
                <a href={`/${selectedStoreStats.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition">Live Store</a>
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

          <section className="mt-8">
            <DevTeamReferrals />
          </section>

        </div>

        <nav className="fixed bottom-0 left-0 w-full z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg flex sm:hidden justify-around py-2">
          <Link href="/devteam" className="flex flex-col items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-semibold">
            <ShoppingBag className="w-6 h-6 mb-1" />
            Dashboard
          </Link>
          <Link href="/admin" className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-semibold">
            <ClipboardListIcon className="w-6 h-6 mb-1" />
            Admin
          </Link>
        </nav>
      </div>
    </>
  );
}
