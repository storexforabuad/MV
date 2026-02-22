'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Check,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Star,
  MapPin,
  ShoppingCart,
  Eye,
  EyeOff,
  Pause,
  Play,
  Trash2,
  Settings,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { sendWholesaleRequest, getDiscoverableStores, getWholesalePartners, getWholesaleRequests, pauseWholesalePartner, resumeWholesalePartner, removeWholesalePartner, updateWholesaleConfig, acceptWholesaleRequest, rejectWholesaleRequest, blockWholesaleRequest } from '@/app/actions/wholesaleActions';
import { StoreMeta } from '@/types/store';
import { WholesalePartner, WholesaleRequest } from '@/types/wholesale';
import { PartnerDetailModal } from './modals/PartnerDetailModal';
import { OrderReviewModal } from './modals/OrderReviewModal';
import toast from 'react-hot-toast';

interface WarehouseHubProps {
  storeId: string;
  storeName?: string;
}

type Tab = 'discovery' | 'requests' | 'partners' | 'settings';

export default function WarehouseHub({
  storeId,
  storeName = 'Store',
}: WarehouseHubProps) {
  const [activeTab, setActiveTab] = useState<Tab>('discovery');
  const [loading, setLoading] = useState(false);

  // Discovery state
  const [discoverableStores, setDiscoverableStores] = useState<StoreMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'products' | 'orders' | 'location'>(
    'products'
  );

  // Requests state
  const [incomingRequests, setIncomingRequests] = useState<WholesaleRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<WholesaleRequest[]>([]);

  // Partners state
  const [partners, setPartners] = useState<WholesalePartner[]>([]);

  // Settings state
  const [isVisible, setIsVisible] = useState(true);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState<0 | 7 | 14 | 30>(0);

  // Send request modal
  const [showSendRequest, setShowSendRequest] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreMeta | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  // Partner detail modal
  const [showPartnerDetail, setShowPartnerDetail] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<WholesalePartner | null>(null);
  const [partnerStoreData, setPartnerStoreData] = useState<StoreMeta | null>(null);

  // Order review modal
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPaymentTerms, setOrderPaymentTerms] = useState<0 | 7 | 14 | 30>(0);

  // Load data based on active tab
  useEffect(() => {
    // We removed isOpen, so this effect runs on mount and tab changes
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'discovery') {
          const result = await getDiscoverableStores(storeId, searchQuery, sortBy);
          if (result.success && result.stores) {
            setDiscoverableStores(result.stores);
          }
        } else if (activeTab === 'requests') {
          const incomingRes = await getWholesaleRequests(storeId, 'incoming');
          const outgoingRes = await getWholesaleRequests(storeId, 'outgoing');
          if (incomingRes.success && incomingRes.requests) {
            setIncomingRequests(incomingRes.requests);
          }
          if (outgoingRes.success && outgoingRes.requests) {
            setOutgoingRequests(outgoingRes.requests);
          }
        } else if (activeTab === 'partners') {
          const result = await getWholesalePartners(storeId);
          if (result.success && result.partners) {
            setPartners(result.partners);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, storeId, searchQuery, sortBy]);

  // Load partner store data when partner is selected
  useEffect(() => {
    if (selectedPartner && showPartnerDetail) {
      const loadPartnerData = async () => {
        try {
          // In a real app, you'd fetch from API
          // For now, get from discoverable stores if available
          const found = discoverableStores.find((s) => s.id === selectedPartner.partnerStoreId);
          if (found) {
            setPartnerStoreData(found);
          } else {
            // Fallback: create minimal store data from partner info
            setPartnerStoreData({
              id: selectedPartner.partnerStoreId,
              name: selectedPartner.partnerStoreName,
              logo: '',
              category: selectedPartner.storeType ? [selectedPartner.storeType] : [],
              followers: 0,
              views: 0,
              createdAt: selectedPartner.connectedAt,
              owner: '',
              products: [],
              whatsapp: '',
              wholesaleConfig: selectedPartner.wholesaleConfig,
            } as StoreMeta);
          }
        } catch (error) {
          console.error('Error loading partner data:', error);
        }
      };
      loadPartnerData();
    }
  }, [selectedPartner, showPartnerDetail, discoverableStores]);

  const handleSendRequest = async (toStoreId: string) => {
    try {
      setLoading(true);
      const result = await sendWholesaleRequest(storeId, toStoreId, requestMessage);
      if (result.success) {
        toast.success('Request sent successfully!');
        setShowSendRequest(false);
        setSelectedStore(null);
        setRequestMessage('');
        setActiveTab('requests');
      } else {
        toast.error(result.error || 'Failed to send request');
      }
    } catch (error) {
      toast.error('Error sending request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const result = await acceptWholesaleRequest(requestId, storeId);
      if (result.success) {
        toast.success('Request accepted!');
        setActiveTab('partners');
      } else {
        toast.error(result.error || 'Failed to accept request');
      }
    } catch (error) {
      toast.error('Error accepting request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const result = await rejectWholesaleRequest(requestId, storeId);
      if (result.success) {
        toast.success('Request rejected');
        // Reload requests
        const incomingRes = await getWholesaleRequests(storeId, 'incoming');
        if (incomingRes.success && incomingRes.requests) {
          setIncomingRequests(incomingRes.requests);
        }
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    } catch (error) {
      toast.error('Error rejecting request');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const result = await blockWholesaleRequest(requestId, storeId);
      if (result.success) {
        toast.success('Store blocked for 30 days');
        const incomingRes = await getWholesaleRequests(storeId, 'incoming');
        if (incomingRes.success && incomingRes.requests) {
          setIncomingRequests(incomingRes.requests);
        }
      } else {
        toast.error(result.error || 'Failed to block');
      }
    } catch (error) {
      toast.error('Error blocking store');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      setLoading(true);
      const result = await updateWholesaleConfig(storeId, {
        isVisible,
        globalDiscount,
        minOrderValue,
        defaultPaymentTermsDays: paymentTerms,
      });
      if (result.success) {
        toast.success('Settings updated!');
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePausePartner = async (partnerId: string) => {
    try {
      await pauseWholesalePartner(storeId, partnerId);
      toast.success('Partnership paused');
      const result = await getWholesalePartners(storeId);
      if (result.success && result.partners) {
        setPartners(result.partners);
      }
    } catch (error) {
      toast.error('Error pausing partnership');
    }
  };

  const handleRemovePartner = async (partnerId: string) => {
    if (!confirm('Remove this partnership? This cannot be undone.')) return;
    try {
      await removeWholesalePartner(storeId, partnerId);
      toast.success('Partnership removed');
      const result = await getWholesalePartners(storeId);
      if (result.success && result.partners) {
        setPartners(result.partners);
      }
    } catch (error) {
      toast.error('Error removing partnership');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
      {/* --- Header --- */}
      <header className="flex-shrink-0 w-full border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="px-6">
          <div className="flex items-center justify-between py-5">
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-500">
                B2B Dropshipping Hub
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Discover partners & source wholesale products</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 py-2">
            {(['discovery', 'requests', 'partners', 'settings'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${activeTab === tab
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                {tab === 'discovery' && 'Discover'}
                {tab === 'requests' && `Requests${incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ''}`}
                {tab === 'partners' && 'Partners'}
                {tab === 'settings' && 'Settings'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* --- Main Scrollable Content --- */}
      <main className="flex-grow w-full overflow-y-auto p-6 scrollbar-hide">
        {loading && (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="animate-spin">
              <ShoppingCart className="w-10 h-10 text-amber-500" />
            </div>
          </div>
        )}

        {!loading && activeTab === 'discovery' && (
          <DiscoveryTab
            stores={discoverableStores}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onRequestClick={(store) => {
              setSelectedStore(store);
              setShowSendRequest(true);
            }}
          />
        )}

        {!loading && activeTab === 'requests' && (
          <RequestsTab
            incoming={incomingRequests}
            outgoing={outgoingRequests}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
            onBlock={handleBlockRequest}
          />
        )}

        {!loading && activeTab === 'partners' && (
          <PartnersTab
            partners={partners}
            onPause={handlePausePartner}
            onRemove={handleRemovePartner}
            onPartnerClick={(partner) => {
              setSelectedPartner(partner);
              setShowPartnerDetail(true);
            }}
          />
        )}

        {!loading && activeTab === 'settings' && (
          <SettingsTab
            isVisible={isVisible}
            onVisibilityChange={setIsVisible}
            globalDiscount={globalDiscount}
            onDiscountChange={setGlobalDiscount}
            minOrderValue={minOrderValue}
            onMinOrderChange={setMinOrderValue}
            paymentTerms={paymentTerms}
            onPaymentTermsChange={setPaymentTerms}
            onSave={handleUpdateConfig}
            saving={loading}
          />
        )}
      </main>

      {/* Send Request Modal */}
      <SendRequestModal
        isOpen={showSendRequest}
        onClose={() => {
          setShowSendRequest(false);
          setSelectedStore(null);
          setRequestMessage('');
        }}
        store={selectedStore}
        message={requestMessage}
        onMessageChange={setRequestMessage}
        onSend={() => selectedStore && handleSendRequest(selectedStore.id)}
        sending={loading}
      />

      {/* Partner Detail Modal */}
      {
        selectedPartner && partnerStoreData && (
          <PartnerDetailModal
            partner={partnerStoreData}
            buyerStoreId={storeId}
            isOpen={showPartnerDetail}
            onClose={() => {
              setShowPartnerDetail(false);
              setSelectedPartner(null);
              setPartnerStoreData(null);
            }}
            onOrderReview={(items, total, paymentTerms) => {
              setOrderItems(items);
              setOrderTotal(total);
              setOrderPaymentTerms(paymentTerms as 0 | 7 | 14 | 30);
              setShowPartnerDetail(false);
              setShowOrderReview(true);
            }}
          />
        )
      }

      {/* Order Review Modal */}
      {
        selectedPartner && partnerStoreData && (
          <OrderReviewModal
            partner={partnerStoreData}
            buyerStoreId={storeId}
            items={orderItems}
            total={orderTotal}
            paymentTermsDays={orderPaymentTerms}
            isOpen={showOrderReview}
            onClose={() => {
              setShowOrderReview(false);
              setOrderItems([]);
              setOrderTotal(0);
              setOrderPaymentTerms(0);
            }}
            onSuccess={(orderId) => {
              toast.success('Order created successfully!');
              setShowOrderReview(false);
              setOrderItems([]);
              setOrderTotal(0);
              setOrderPaymentTerms(0);
              // Reload partners to show updated stats
              const reloadPartners = async () => {
                const result = await getWholesalePartners(storeId);
                if (result.success && result.partners) {
                  setPartners(result.partners);
                }
              };
              reloadPartners();
            }}
          />
        )
      }
    </div>
  );
}

// ========== TAB COMPONENTS ==========

function DiscoveryTab({
  stores,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onRequestClick,
}: {
  stores: StoreMeta[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'rating' | 'products' | 'orders' | 'location';
  onSortChange: (s: typeof sortBy) => void;
  onRequestClick: (store: StoreMeta) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search stores..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="products">By Products</option>
          <option value="rating">By Rating</option>
          <option value="orders">By Orders</option>
          <option value="location">By Location</option>
        </select>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-2" />
          <p className="text-slate-600 dark:text-slate-400">
            No wholesale partners available in your category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <motion.div
              key={store.id || `store-${Math.random()}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-lg dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-start gap-3 mb-3">
                {store.logo ? (
                  <img
                    src={store.logo}
                    alt={store.name || 'Store'}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {store.name || 'Unknown Store'}
                  </h3>
                  {store.state ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" /> {store.state}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" /> Location not set
                    </p>
                  )}
                </div>
              </div>

              {/* Description: Show if available, otherwise show fallback */}
              {store.businessDescription && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {store.businessDescription}
                </p>
              )}

              <div className="space-y-2 mb-4 text-sm text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <Star className="w-4 h-4 flex-shrink-0" /> 4.5/5.0
                </p>
                <p className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                  {store.totalOrders && store.totalOrders > 0
                    ? `${store.totalOrders} orders/month`
                    : 'New seller'}
                </p>
              </div>

              <button
                onClick={() => onRequestClick(store)}
                className="w-full bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 transition"
              >
                Send Request
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestsTab({
  incoming,
  outgoing,
  onAccept,
  onReject,
  onBlock,
}: {
  incoming: WholesaleRequest[];
  outgoing: WholesaleRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onBlock: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Incoming Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Incoming Requests
        </h3>
        {incoming.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No incoming requests</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    Store #{req.fromStoreId}
                  </p>
                  {req.message && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      "{req.message}"
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {req.createdAt && (req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : req.createdAt.toDate?.().toLocaleDateString())}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(req.id)}
                    className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                    title="Accept"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onReject(req.id)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onBlock(req.id)}
                    className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    title="Block"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Outgoing Requests
        </h3>
        {outgoing.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No outgoing requests</p>
        ) : (
          <div className="space-y-3">
            {outgoing.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    Store #{req.toStoreId}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${req.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}
                    >
                      {req.status === 'pending' ? 'Pending' : 'Accepted'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Sent: {req.createdAt && (req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : req.createdAt.toDate?.().toLocaleDateString())}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnersTab({
  partners,
  onPause,
  onRemove,
  onPartnerClick,
}: {
  partners: WholesalePartner[];
  onPause: (id: string) => void;
  onRemove: (id: string) => void;
  onPartnerClick: (partner: WholesalePartner) => void;
}) {
  return (
    <div>
      {partners.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 mx-auto text-slate-400 mb-2" />
          <p className="text-slate-600 dark:text-slate-400">
            No active partnerships yet. Use Discovery tab to send requests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((partner) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-lg transition"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => onPartnerClick(partner)}
                    disabled={partner.status !== 'active'}
                    className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {partner.partnerStoreName}
                  </button>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${partner.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                  >
                    {partner.status === 'active' ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                <p>Total Orders: {partner.totalOrders}</p>
                <p>Revenue: ₦{partner.totalRevenue.toLocaleString()}</p>
                {partner.lastOrderDate && (
                  <p className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last order: {(partner.lastOrderDate instanceof Date ? partner.lastOrderDate.toLocaleDateString() : partner.lastOrderDate.toDate?.().toLocaleDateString())}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {partner.status === 'active' && (
                  <button
                    onClick={() => onPartnerClick(partner)}
                    className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-sm font-medium"
                  >
                    <ShoppingCart className="w-4 h-4 inline mr-1" /> Browse & Order
                  </button>
                )}
                <button
                  onClick={() => onPause(partner.id)}
                  className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-medium"
                >
                  {partner.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4 inline mr-1" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 inline mr-1" /> Resume
                    </>
                  )}
                </button>
                <button
                  onClick={() => onRemove(partner.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({
  isVisible,
  onVisibilityChange,
  globalDiscount,
  onDiscountChange,
  minOrderValue,
  onMinOrderChange,
  paymentTerms,
  onPaymentTermsChange,
  onSave,
  saving,
}: {
  isVisible: boolean;
  onVisibilityChange: (v: boolean) => void;
  globalDiscount: number;
  onDiscountChange: (d: number) => void;
  minOrderValue: number;
  onMinOrderChange: (v: number) => void;
  paymentTerms: 0 | 7 | 14 | 30;
  onPaymentTermsChange: (t: 0 | 7 | 14 | 30) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Visibility */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-lg font-semibold text-slate-900 dark:text-white">
            Wholesale Visibility
          </label>
          <button
            onClick={() => onVisibilityChange(!isVisible)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${isVisible ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${isVisible ? 'translate-x-7' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          When off, other vendors won't see you in their discovery lists
        </p>
      </div>

      {/* Discount */}
      <div>
        <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Global Wholesale Discount
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="0"
            max="100"
            value={globalDiscount}
            onChange={(e) => onDiscountChange(parseInt(e.target.value) || 0)}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <span className="text-lg font-medium">%</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Default discount on all products. Can override per product.
        </p>
      </div>

      {/* Min Order */}
      <div>
        <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Minimum Order Value
        </label>
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium">₦</span>
          <input
            type="number"
            min="0"
            value={minOrderValue}
            onChange={(e) => onMinOrderChange(parseInt(e.target.value) || 0)}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Buyers must order at least this amount
        </p>
      </div>

      {/* Payment Terms */}
      <div>
        <label className="block text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Default Payment Terms
        </label>
        <select
          value={paymentTerms}
          onChange={(e) => onPaymentTermsChange(parseInt(e.target.value) as 0 | 7 | 14 | 30)}
          className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="0">Immediate Payment</option>
          <option value="7">7 Days</option>
          <option value="14">14 Days</option>
          <option value="30">30 Days</option>
        </select>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Buyers can choose different terms at checkout, but this is your default
        </p>
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 transition"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

function SendRequestModal({
  isOpen,
  onClose,
  store,
  message,
  onMessageChange,
  onSend,
  sending,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: StoreMeta | null;
  message: string;
  onMessageChange: (m: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  if (!isOpen || !store) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full"
      >
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
          Request to Buy from {store.name}
        </h3>

        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Optional message (e.g., 'I'm interested in fashion items')"
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none h-24 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
