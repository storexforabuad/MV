"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SlotCard from '@/components/pitch/SlotCard';
import { confirmPayment } from '@/app/actions/bookingActions';
import { submitCommissionPayment } from '@/app/actions/commissionPaymentActions';
import { useVendor } from '@/context/VendorContext';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

export default function AdminBookingsModal({ isOpen, onClose, storeId }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const { vendor } = useVendor();

  useEffect(() => {
    if (!isOpen || !storeId) return;
    const col = collection(db, `stores/${storeId}/bookings`);
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setBookings(docs);
    });
    return () => unsub();
  }, [isOpen, storeId]);

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmPayment({ storeId, bookingId });
      toast.success('Payment confirmed');

      // submit a commission payment record (lightweight) for accounting/reconciliation
      try {
        const booking = bookings.find(b => b.id === bookingId) as any;
        const amount = (booking && (booking.totalAmount ?? booking.amount)) || 0;
        await submitCommissionPayment({
          storeId,
          amount,
          periodStart: booking?.date || new Date().toISOString().slice(0,10),
          periodEnd: booking?.date || new Date().toISOString().slice(0,10),
          accountNumber: (vendor && (vendor.accountNumber || '')) || '',
          accountName: (vendor && (vendor.name || vendor.phone)) || '',
          notes: `Commission for booking ${bookingId}`,
          uploadedBy: vendor?.phone || undefined,
        });
        toast.success('Commission recorded');
      } catch (err) {
        console.error('Failed to submit commission payment', err);
        toast.error('Commission record failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm';
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Bookings</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        <div className="grid gap-3">
          {bookings.length === 0 && <div className="text-sm text-gray-500">No bookings yet.</div>}
          {bookings.map(b => (
            <div key={b.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.pitchId} — {b.date} {b.startTime}</div>
                <div className="text-sm text-gray-500">Customer: {b.customerPhone}</div>
                <div className="text-sm text-gray-500">Status: {b.status} / {b.paymentStatus}</div>
              </div>
              <div className="flex items-center gap-2">
                {b.paymentStatus !== 'paid' && (
                  <button onClick={() => handleConfirm(b.id)} className="px-3 py-2 rounded bg-green-600 text-white">Confirm Payment</button>
                )}
                {b.paymentStatus === 'paid' && <div className="text-sm text-green-600 font-semibold">Paid</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
