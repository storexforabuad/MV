'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Repeat, MessageSquare, Clock, CheckCircle, Truck, FileText, AlertCircle, Download, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Order } from '../../../hooks/useOrders';
import { formatPrice } from '../../../utils/price';
import { useCustomer } from '@/context/CustomerContext';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';
import { CartItem } from '@/lib/cartContext';
import { isSolarProduct, isTicketProduct, isDigitalProduct } from '@/utils/productHelpers';
import EscrowDeliverablePanel from '@/components/admin/EscrowDeliverablePanel';
import OrderReceiptModal from '../modals/OrderReceiptModal';
import TicketScannerModal from '../modals/TicketScannerModal';
import QRCode from 'react-qr-code';
import { Camera, QrCode, Maximize2, BarChart3, X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface OrderDetailCardProps {
  order: Order;
  addOrder: (products: (Product | CartItem)[], storeMeta: StoreMeta, customerInfo: Customer, referralCode: string | null, bonusApplied?: boolean, deliveryMethod?: "home" | "pickup", orderNotes?: string, paymentEvidenceUrl?: string, paymentEvidenceFileName?: string) => Promise<any>;
  storeMeta: StoreMeta;
  isHighlighted?: boolean;
  onReorder?: (order: Order) => void;
  onRefresh?: () => void;
  storeId?: string;
}

const getStatusUI = (status: Order['orderStatus'], storeType?: string) => {
  const isInfluencer = storeType === 'media-influencer';
  switch (status) {
    case 'disputed':
      return { icon: <AlertCircle className="w-4 h-4" />, text: 'Disputed', color: 'text-red-400' };
    case 'shipped':
      return {
        icon: isInfluencer ? <CheckCircle className="w-4 h-4" /> : <Truck className="w-4 h-4" />,
        text: isInfluencer ? 'Completed' : 'Shipped',
        color: isInfluencer ? 'text-green-400' : 'text-blue-400'
      };
    case 'ready':
      return { icon: <CheckCircle className="w-4 h-4" />, text: 'Ready for Pickup', color: 'text-green-400' };
    case 'partially-ready':
      return { icon: <CheckCircle className="w-4 h-4" />, text: 'Partially Ready', color: 'text-yellow-400' };
    case 'processing':
    default:
      return null;
  }
};

export function OrderDetailCard({ order, addOrder, storeMeta, isHighlighted, onReorder, storeId, onRefresh }: OrderDetailCardProps) {
  const [isReordering, setIsReordering] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const { customer } = useCustomer();

  const products = order.products || [];
  const isServiceOrder = products.some((p: any) => p.productType === 'media-influencer' && (p.subtype === 'service' || p.subtype === 'event-ticket-promo'));
  const isEventPromoOrder = products.some((p: any) => p.productType === 'media-influencer' && p.subtype === 'event-ticket-promo');
  const isTicketOrder = products.some((p: any) => isTicketProduct(p));
  const resolvedStoreId = storeId || storeMeta?.id || '';

  const [showFullQR, setShowFullQR] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleReorder = async () => {
    if (onReorder) {
      onReorder(order);
    }
  };

  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // FIX: Use the backward-compatible 'products' array for calculation.
  const totalAmount = products.reduce((acc, p) => acc + p.price * (p.productType === 'general' ? p.quantity : 1), 0);
  const statusInfo = getStatusUI(order.orderStatus, storeMeta?.storeType);

  return (
    <>
      <div className={`bg-card-background rounded-2xl shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl ${isHighlighted ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/20' : ''
        }`}>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg card-text-gradient truncate">Order #{order.id.substring(0, 6)}</p>
              <p className="text-sm text-text-secondary">Placed on {orderDate}</p>
            </div>
            <div className={`flex items-center gap-2 text-sm font-medium ${statusInfo?.color || ''}`}>
              {statusInfo && (
                isHighlighted && order.orderStatus === 'ready' ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, repeat: 2, repeatType: "reverse" }}
                    className="flex items-center gap-2"
                  >
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                  </motion.div>
                ) : (
                  <>
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                  </>
                )
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* FIX: Use the backward-compatible 'products' array for rendering. */}
            {products.map((product, index) => {
              // Defensive check for images, as legacy product objects might not have an 'images' array.
              const imageUrl = product.images && product.images.length > 0 ? product.images[0] : undefined;
              return (
                <div key={product.id || index} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 relative flex-shrink-0">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover rounded-md"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">{product.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {((product as any).selectedColor) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Color: {(product as any).selectedColor}
                          </span>
                        )}
                        {((product as any).selectedSize) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Size: {(product as any).selectedSize}
                          </span>
                        )}
                        {((product as any).selectedSpiciness) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800">
                            {(product as any).selectedSpiciness === 'mild' && '😌 Mild'}
                            {(product as any).selectedSpiciness === 'medium' && '🌶️ Medium'}
                            {(product as any).selectedSpiciness === 'hot' && '🔥 Hot'}
                            {(product as any).selectedSpiciness === 'extra-hot' && '🤯 Extra Hot'}
                          </span>
                        )}
                        {((product as any).temperature) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                            {(product as any).temperature === 'hot' && '☕ Hot'}
                            {(product as any).temperature === 'cold' && '❄️ Cold'}
                            {(product as any).temperature === 'room-temp' && '🌡️ Room'}
                          </span>
                        )}
                        {isSolarProduct(product as any) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                            {(() => {
                              const s = product as any;
                              switch (s.subtype) {
                                case 'panel': return `☀️ ${s.wattage}`;
                                case 'inverter': return `🔄 ${s.inverterCapacity}`;
                                case 'battery': return `🔋 ${s.batteryCapacity}`;
                                case 'controller': return `🎛️ ${s.controllerAmperage}`;
                                case 'appliance': return `⚡ ${s.powerRating}`;
                                default: return 'Solar';
                              }
                            })()}
                          </span>
                        )}
                        {isDigitalProduct(product as any) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                            <Zap className="w-3 h-3 mr-1" /> Digital
                          </span>
                        )}
                      </div>
                      {((product as any).specialInstructions) && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                          <span className="font-semibold">Note:</span> {(product as any).specialInstructions}
                        </div>
                      )}
                      {((product as any).brandName) && (
                        <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded text-xs text-indigo-800 dark:text-indigo-200">
                          <span className="font-semibold uppercase tracking-wider text-[10px] block mb-1">Brand Name</span> {(product as any).brandName}
                        </div>
                      )}
                      {((product as any).campaignBrief) && (
                        <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded text-xs text-indigo-800 dark:text-indigo-200">
                          <span className="font-semibold uppercase tracking-wider text-[10px] block mb-1">Campaign Brief</span> {(product as any).campaignBrief}
                        </div>
                      )}
                      <p className="text-xs text-text-secondary mt-1">Qty: {product.productType === 'general' || product.productType === 'ticket' ? (product as any).quantity : 1}</p>
                    </div>
                    <p className="font-semibold text-text-primary text-sm whitespace-nowrap">{formatPrice(product.price * (product.productType === 'general' || product.productType === 'ticket' ? (product as any).quantity : 1))}</p>
                  </div>
                  
                  {isDigitalProduct(product as any) && (product as any).digitalDetails?.externalUrl && (order.paymentStatus === 'escrow-held' || order.paymentStatus === 'escrow-released') && (
                     <div className="pl-[60px] pb-2">
                        <a href={(product as any).digitalDetails.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                           <Download className="w-3.5 h-3.5" /> Re-download {(product as any).digitalDetails?.fileType || 'File'}
                        </a>
                     </div>
                  )}
                </div>
              );
            })}

            {/* Attendee QR Code View */}
            {isTicketOrder && (order.paymentStatus === 'escrow-held' || order.paymentStatus === 'escrow-released') && (
              <div className="mt-6 p-6 rounded-3xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Your Entry Ticket</span>
                </div>

                <div
                  onClick={() => setShowFullQR(true)}
                  className="bg-white p-4 rounded-2xl shadow-inner cursor-pointer hover:scale-105 transition-transform"
                >
                  <QRCode
                    value={JSON.stringify({ orderId: order.id, customerId: customer?.id })}
                    size={140}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>

                <button
                  onClick={() => setShowFullQR(true)}
                  className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:opacity-80"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Tap to Enlarge for Scan
                </button>
              </div>
            )}

            {/* Brand Event Management Dashboard (B2B) */}
            {isEventPromoOrder && (
              <div className="mt-6 p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Event Dashboard</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    Live Status
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-white dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Tickets Sold</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{(order as any).soldCount || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Scanned</p>
                    <p className="text-xl font-black text-green-600">{(order as any).scannedCount || 0}</p>
                  </div>
                </div>

                <button
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Camera className="w-5 h-5" />
                  Open Ticket Scanner
                </button>
              </div>
            )}
          </div>

          {
            order.orderNotes && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Special Instructions</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{order.orderNotes}"</p>
              </div>
            )
          }

          <div className="mt-4 pt-4 border-t border-border-color flex justify-between items-center">
            <p className="font-semibold text-text-secondary">Total</p>
            <p className="text-lg font-bold text-purple-400">{formatPrice(totalAmount)}</p>
          </div>

          {/* Brand Escrow Approval Panel — shown when influencer has submitted deliverable */}
          {isServiceOrder && resolvedStoreId && (
            <div className="mt-4">
              <EscrowDeliverablePanel
                orderId={order.id}
                storeId={resolvedStoreId}
                isInfluencerView={false}
                paymentStatus={order.paymentStatus}
                orderStatus={order.orderStatus}
                deliverableUrl={(order as any).deliverableUrl}
                onUpdate={onRefresh}
              />
            </div>
          )}
        </div>
        <div className="flex border-t border-border-color">
          <button
            onClick={handleReorder}
            disabled={isReordering}
            className="flex-1 flex items-center justify-center gap-2 p-4 text-xs font-bold text-text-secondary hover:bg-zinc-800 transition-colors border-r border-border-color disabled:opacity-50"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Reorder</span>
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 p-4 text-xs font-bold text-purple-400 hover:bg-zinc-800 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Receipt</span>
          </button>
        </div>
      </div>

      <OrderReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={order}
      />

      {/* Full Screen QR Modal */}
      <Transition.Root show={showFullQR} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={() => setShowFullQR(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black backdrop-blur-md transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="relative w-full max-w-sm transform overflow-hidden rounded-[2.5rem] bg-white p-8 text-center shadow-2xl transition-all">
                  <button onClick={() => setShowFullQR(false)} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                    <X className="w-6 h-6" />
                  </button>

                  <div className="mt-4 mb-8">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{products[0]?.name}</h3>
                    <p className="text-sm font-bold text-rose-600 mt-1 uppercase tracking-widest">Official Entry Ticket</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-gray-50 inline-block mb-8">
                    <QRCode
                      value={JSON.stringify({ orderId: order.id, customerId: customer?.id })}
                      size={220}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Order ID</span>
                      <span className="text-xs font-bold text-gray-900">#{order.id.substring(0, 8)}</span>
                    </div>
                    {((products[0] as any).selectedTierId) && (
                      <div className="flex justify-between items-center px-4 py-3 bg-rose-50 rounded-2xl border border-rose-100">
                        <span className="text-[10px] font-black text-rose-400 uppercase">Tier</span>
                        <span className="text-xs font-bold text-rose-700">Regular</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-8 text-xs text-gray-400 font-medium leading-relaxed">
                    Present this QR code at the venue entrance. <br />
                    Ensure your screen brightness is at maximum.
                  </p>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <TicketScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        brandOrderId={order.id}
        onScanSuccess={onRefresh}
      />
    </>
  );
}
