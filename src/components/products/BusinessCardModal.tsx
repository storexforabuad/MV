'use client';

import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Phone, MessageCircle, Star, Clock, MapPin, Instagram, X, Navigation, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { useModalBackNavigation } from '@/hooks/useModalBackNavigation';
import { StoreMeta } from '../../types/store';
import { formatWhatsAppNumber } from '@/utils/phoneUtils';

export function BusinessCardModal({ open, onClose, storeMeta }: { open: boolean; onClose: () => void; storeMeta?: StoreMeta }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle back button navigation
  useModalBackNavigation(open, onClose, 'business-card');

  if (!storeMeta) return null;

  const fullAddress = [
    storeMeta.shopNumber,
    storeMeta.plazaBuildingName,
    storeMeta.streetAddress,
    storeMeta.state,
    storeMeta.country
  ].filter(Boolean).join(', ');

  const isInfluencer = storeMeta.storeType === 'media-influencer';
  const socialStats = storeMeta.socialStats || {
    instagramFollowers: 45000,
    tiktokFollowers: 125000,
    youtubeSubscribers: 8500,
    twitterFollowers: 12000
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const handleGetDirections = () => {
    if (fullAddress) {
      const encodedAddress = encodeURIComponent(fullAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative w-full transform overflow-hidden rounded-t-[2rem] bg-white dark:bg-modal-background text-left align-middle shadow-2xl transition-all flex flex-col max-h-[75vh] sm:max-w-2xl sm:rounded-2xl sm:max-h-[75vh]">

                {/* Handle Bar for Mobile */}
                <div className="flex-shrink-0 pt-3 pb-1 flex justify-center sm:hidden">
                  <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-modal-background">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    About Store
                  </h2>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors shadow-sm"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Content */}
                <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-6">
                  <div className="max-w-3xl mx-auto w-full">
                    <div className="text-center mb-8">
                      {(storeMeta.logo || storeMeta.ceoImage) && (
                        <div className="relative inline-block">
                          <Image
                            src={storeMeta.logo || storeMeta.ceoImage || ''}
                            alt={storeMeta.name || 'Store Logo'}
                            width={100}
                            height={100}
                            className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-800 mx-auto mb-4"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-slate-800" />
                        </div>
                      )}
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        {storeMeta.name}
                      </h3>

                      {/* Compass Verified Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-3 animate-pulse-slow">
                        <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/50" />
                        <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 tracking-widest uppercase">
                          Compass 🧭 Verified Seller
                        </span>
                      </div>
                      {storeMeta.ceoName && (
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
                          Led by {storeMeta.ceoName}
                        </p>
                      )}
                      {storeMeta.businessDescription && (
                        <p className="text-base text-gray-600 dark:text-gray-300 mt-4 leading-relaxed max-w-sm mx-auto">
                          {storeMeta.businessDescription}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-1 mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {storeMeta.hasPhysicalShop && fullAddress && (
                        <div className="group bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-blue-200 dark:hover:border-blue-900">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Store Location</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                                {fullAddress}
                              </p>
                              <button
                                onClick={handleGetDirections}
                                className="mt-3 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                              >
                                <Navigation size={16} />
                                <span>Get Directions</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Opening Hours</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">Open 24/7</p>
                            </div>
                          </div>
                        </div>

                        {storeMeta.businessInstagram && (
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                                <Instagram className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Instagram</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">@{storeMeta.businessInstagram.replace('@', '')}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {isInfluencer && (
                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2 mb-4">
                            <BadgeCheck className="w-4 h-4 text-pink-500" />
                            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Social Reach</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                              <span className="text-sm mb-1">📸</span>
                              <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{formatNumber(socialStats.instagramFollowers || 45000)}</p>
                              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1">Instagram</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                              <span className="text-sm mb-1">🎵</span>
                              <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{formatNumber(socialStats.tiktokFollowers || 125000)}</p>
                              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1">TikTok</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                              <span className="text-sm mb-1">📺</span>
                              <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{formatNumber(socialStats.youtubeSubscribers || 8500)}</p>
                              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1">YouTube</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                              <span className="text-sm mb-1">🐦</span>
                              <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{formatNumber(socialStats.twitterFollowers || 12000)}</p>
                              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1">Twitter</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-[10px] font-bold text-center text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-8 flex items-center justify-center gap-1.5 translate-y-2">
                        Powered by <span className="text-slate-500 dark:text-slate-300">Compass 🧭 2026.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-modal-background p-4 sm:px-6">
                  <div className="max-w-3xl mx-auto w-full grid grid-cols-2 gap-4">
                    <a
                      href={`tel:${storeMeta.whatsapp?.replace(/\s/g, '')}`}
                      className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
                    >
                      <Phone size={20} />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${formatWhatsAppNumber(storeMeta.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5b] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
                    >
                      <MessageCircle size={20} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
