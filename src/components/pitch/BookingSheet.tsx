"use client";

import { useState, useRef, useEffect } from 'react';
import CalendarStrip from './CalendarStrip';
import SlotCard from './SlotCard';
import CustomerLookupModal from '../customer/CustomerLookupModal';
import { createBooking } from '@/app/actions/bookingActions';
import toast from 'react-hot-toast';
import useSlotLocks from '../../hooks/useSlotLocks';

// Booking Summary Card Component
interface BookingSummaryCardProps {
  selectedDate: string;
  selectedSlot: string | null;
  pricePerSlot: number;
  customer: any;
  onSelectCustomer: () => void;
  onHoldSlot: () => void;
  isHolding: boolean;
  bookingResult: { bookingId?: string } | null;
  lastError: string | null;
  isMobile?: boolean;
}

function BookingSummaryCard({
  selectedDate,
  selectedSlot,
  pricePerSlot,
  customer,
  onSelectCustomer,
  onHoldSlot,
  isHolding,
  bookingResult,
  lastError,
  isMobile = false,
}: BookingSummaryCardProps) {
  return (
    <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
      {/* Summary Details */}
      <div className={`${isMobile ? 'flex justify-between items-center text-xs' : 'space-y-2'}`}>
        {!isMobile && (
          <>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Booking Summary</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Date: <span className="font-medium text-gray-900 dark:text-white">{selectedDate}</span></p>
              <p>Slot: <span className="font-medium text-gray-900 dark:text-white">{selectedSlot || '—'}</span></p>
              <p>Price: <span className="font-semibold text-teal-600 dark:text-teal-400">₦{pricePerSlot.toFixed(0)}</span></p>
            </div>
          </>
        )}
        {isMobile && (
          <>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{selectedSlot || 'No slot'}</p>
              <p className="text-gray-500 dark:text-gray-400">{selectedDate}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-teal-600 dark:text-teal-400">₦{pricePerSlot.toFixed(0)}</p>
            </div>
          </>
        )}
      </div>

      {/* Customer Section */}
      {isMobile ? (
        <button
          onClick={onSelectCustomer}
          className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/30 dark:to-cyan-900/30 border border-emerald-200 dark:border-emerald-800 text-sm font-medium text-gray-900 dark:text-white hover:shadow-sm transition-shadow active:scale-95"
        >
          {customer ? `Customer: ${customer.name || customer.phone}` : '+ Select Customer'}
        </button>
      ) : (
        <>
          <button
            onClick={onSelectCustomer}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-700 text-sm font-medium text-gray-900 dark:text-white hover:shadow-md transition-all active:scale-95"
          >
            {customer ? `✓ ${customer.name || customer.phone}` : '+ Select Customer'}
          </button>
        </>
      )}

      {/* Hold Slot Button */}
      <button
        disabled={!selectedSlot || isHolding}
        onClick={onHoldSlot}
        className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all active:scale-95 ${
          !selectedSlot || isHolding
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:shadow-lg hover:shadow-teal-500/30 dark:hover:shadow-teal-900/50'
        }`}
      >
        {isHolding ? 'Holding…' : 'Hold Slot'}
      </button>

      {/* Success State */}
      {bookingResult?.bookingId && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-300 dark:border-emerald-700">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">✓ Booking Held</p>
          <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">{bookingResult.bookingId}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Awaiting payment/confirmation</p>
        </div>
      )}

      {/* Error State */}
      {lastError && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-300 dark:border-amber-700">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">⚠ Error</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">{lastError}</p>
        </div>
      )}
    </div>
  );
}

interface BookingSheetProps {
  storeId: string;
  pitchId: string;
  pricePerSlot?: number;
  slotDurationMinutes?: number;
  availability?: { start: string; end: string }; // e.g. { start: '08:00', end: '22:00' }
}

function formatTimeLabel(hour: number, minute: number) {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

function generateSlotsForDay(dateISO: string, availability: { start: string; end: string }, slotDuration: number) {
  const [startH, startM] = availability.start.split(':').map(Number);
  const [endH, endM] = availability.end.split(':').map(Number);

  const slots: string[] = [];
  const start = new Date(`${dateISO}T${availability.start}:00`);
  const end = new Date(`${dateISO}T${availability.end}:00`);
  let cur = new Date(start);
  while (cur < end) {
    slots.push(cur.toISOString().slice(11, 16));
    cur = new Date(cur.getTime() + slotDuration * 60 * 1000);
  }
  return slots;
}

export default function BookingSheet({ storeId, pitchId, pricePerSlot = 0, slotDurationMinutes = 60, availability = { start: '08:00', end: '22:00' } }: BookingSheetProps) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ bookingId?: string } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const slotButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const slots = generateSlotsForDay(selectedDate, availability, slotDurationMinutes);

  const { locks } = useSlotLocks(storeId, pitchId);

  const scrollToSlot = (timeSlot: string) => {
    const button = slotButtonRefs.current.get(timeSlot);
    if (button) {
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (selectedSlot) {
      setTimeout(() => scrollToSlot(selectedSlot), 100);
    }
  }, [selectedSlot]);

  const handleSelectSlot = (time: string) => {
    setSelectedSlot(time);
  };

  const handleHoldSlot = async () => {
    if (!selectedSlot) return;
    try {
      setIsHolding(true);
      setLastError(null);
      if (!customer || !customer.phone) {
        setIsHolding(false);
        toast.error('Please select a customer first');
        return;
      }

      const res = await createBooking({
        storeId,
        pitchId,
        dateISO: selectedDate,
        startTime: selectedSlot,
        customerPhone: customer.phone,
        totalAmount: pricePerSlot,
      });
      toast.success('Slot held successfully');
      setBookingResult(res || { bookingId: (res && (res as any).bookingId) || undefined });
      setSelectedSlot(null);
      setIsHolding(false);
    } catch (err) {
      setIsHolding(false);
      const msg = err instanceof Error ? err.message : 'Failed to hold slot';
      setLastError(msg);
      if (msg.toLowerCase().includes('held')) {
        toast.error('Slot currently held by another user. Please choose a different time.');
      } else if (msg.toLowerCase().includes('confirmed')) {
        toast.error('Slot already confirmed/booked. Please choose a different time.');
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Main Content - Slots Grid */}
      <div className="flex-1 px-4 py-4 md:py-6 flex flex-col">
        <div className="md:grid md:grid-cols-3 md:gap-6 flex-1 flex flex-col">
          <div className="md:col-span-2 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 md:mb-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Available Slots</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{selectedDate}</span>
              </div>
              <style>{`
                .slots-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .slots-scroll::-webkit-scrollbar-track {
                  background: transparent;
                }
                .slots-scroll::-webkit-scrollbar-thumb {
                  background: #d1d5db;
                  border-radius: 3px;
                  transition: background 0.3s ease;
                }
                .slots-scroll::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af;
                }
                .slots-scroll::-webkit-scrollbar-thumb:active {
                  background: #6b7280;
                }
                /* Firefox */
                .slots-scroll {
                  scrollbar-color: #d1d5db transparent;
                  scrollbar-width: thin;
                }
              `}</style>
              <div className="slots-scroll overflow-y-auto pr-2 flex-1 max-h-96">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 pb-2">
                  {slots.map((t) => {
                    const lockId = `${pitchId}__${selectedDate}__${t.replace(':', '')}`;
                    const lock = locks[lockId];
                    let status: 'available' | 'held' | 'booked' | 'blocked' | 'event' = 'available';
                    if (lock) {
                      const s = lock.status as string | undefined;
                      const expires = lock.holdExpiresAt as any;
                      if (s === 'confirmed') status = 'booked';
                      else if (s === 'held') {
                        if (expires && typeof expires.toMillis === 'function' && expires.toMillis() > Date.now()) {
                          status = 'held';
                        }
                      }
                    }

                    return (
                      <div
                        key={t}
                        ref={(el) => {
                          if (el) slotButtonRefs.current.set(t, el.querySelector('button') as HTMLButtonElement);
                          else slotButtonRefs.current.delete(t);
                        }}
                      >
                        <SlotCard timeLabel={t} price={pricePerSlot} status={status} isSelected={selectedSlot === t} expiresAt={lock?.holdExpiresAt} onClick={() => handleSelectSlot(t)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar - Booking Summary */}
          <div className="hidden md:block">
            <BookingSummaryCard
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              pricePerSlot={pricePerSlot}
              customer={customer}
              onSelectCustomer={() => setShowCustomerLookup(true)}
              onHoldSlot={handleHoldSlot}
              isHolding={isHolding}
              bookingResult={bookingResult}
              lastError={lastError}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Summary Card (Sticky Footer) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-t from-white to-white/95 dark:from-gray-900 dark:to-gray-900/95 backdrop-blur-xl shadow-2xl">
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <BookingSummaryCard
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            pricePerSlot={pricePerSlot}
            customer={customer}
            onSelectCustomer={() => setShowCustomerLookup(true)}
            onHoldSlot={handleHoldSlot}
            isHolding={isHolding}
            bookingResult={bookingResult}
            lastError={lastError}
            isMobile={true}
          />
        </div>
      </div>

      {/* Add padding to prevent content from being hidden behind sticky footer on mobile */}
      <div className="md:hidden h-52" />

      {showCustomerLookup && (
        <CustomerLookupModal isOpen={showCustomerLookup} onClose={() => setShowCustomerLookup(false)} onSuccess={(c: any) => { setCustomer(c); setShowCustomerLookup(false); }} />
      )}
    </div>
  );
}
