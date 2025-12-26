"use client";

import { useState } from 'react';
import CalendarStrip from './CalendarStrip';
import SlotCard from './SlotCard';
import CustomerLookupModal from '../customer/CustomerLookupModal';
import { createBooking } from '@/app/actions/bookingActions';
import toast from 'react-hot-toast';
import useSlotLocks from '../../hooks/useSlotLocks';

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

  const slots = generateSlotsForDay(selectedDate, availability, slotDurationMinutes);

  const { locks } = useSlotLocks(storeId, pitchId);

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
    <div className="w-full">
      <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
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

              return <SlotCard key={t} timeLabel={t} price={pricePerSlot} status={status} expiresAt={lock?.holdExpiresAt} onClick={() => handleSelectSlot(t)} />;
            })}
          </div>
        </div>

        <aside className="p-4 border rounded-md bg-white dark:bg-gray-900">
          <h4 className="font-semibold">Booking Summary</h4>
          <p className="text-sm text-gray-600">Date: {selectedDate}</p>
          <p className="text-sm text-gray-600">Slot: {selectedSlot || 'No slot selected'}</p>
          <p className="text-sm text-gray-600">Price: ₦{pricePerSlot.toFixed(0)}</p>

          <div className="mt-4">
            <button onClick={() => setShowCustomerLookup(true)} className="w-full px-4 py-2 rounded bg-gray-200">Select Customer</button>
          </div>

          {customer && (
            <div className="mt-2 text-sm">
              <p>Customer: {customer.name || customer.phone}</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button disabled={!selectedSlot || isHolding} onClick={handleHoldSlot} className="flex-1 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
              {isHolding ? 'Holding…' : 'Hold Slot'}
            </button>
          </div>

          {bookingResult?.bookingId && (
            <div className="mt-4 p-3 border rounded bg-green-50">
              <p className="text-sm font-medium">Held booking: <span className="font-mono">{bookingResult.bookingId}</span></p>
              <p className="text-xs text-gray-600">This booking is held for payment/confirmation. Ask the customer to complete payment or confirm via admin.</p>
            </div>
          )}

          {lastError && (
            <div className="mt-3 p-2 bg-red-50 text-red-700 rounded text-sm">{lastError}</div>
          )}
        </aside>
      </div>

      {showCustomerLookup && (
        <CustomerLookupModal isOpen={showCustomerLookup} onClose={() => setShowCustomerLookup(false)} onSuccess={(c: any) => { setCustomer(c); setShowCustomerLookup(false); }} />
      )}
    </div>
  );
}
