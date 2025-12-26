import { db } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';

type CreateBookingParams = {
  storeId: string;
  pitchId: string;
  dateISO: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  customerPhone?: string;
  totalAmount: number;
  holdDurationMins?: number;
};

export async function createBooking(params: CreateBookingParams) {
  const { storeId, pitchId, dateISO, startTime, customerPhone = '', totalAmount, holdDurationMins = 10 } = params;

  const lockId = `${pitchId}__${dateISO}__${startTime.replace(':', '')}`;
  const lockRef = doc(db, `stores/${storeId}/slotLocks/${lockId}`);
  const bookingsCol = collection(db, `stores/${storeId}/bookings`);
  const bookingRef = doc(bookingsCol);

  const now = Date.now();
  const holdExpiresAt = Timestamp.fromMillis(now + holdDurationMins * 60 * 1000);

  return runTransaction(db, async (tx) => {
    const lockSnap = await tx.get(lockRef as any);
    if (lockSnap.exists()) {
      const data: any = lockSnap.data();
      const status = data.status as string | undefined;
      const expires: any = data.holdExpiresAt;
      if (status === 'confirmed') throw new Error('Slot already confirmed');
      if (status === 'held' && expires && expires.toMillis && expires.toMillis() > Date.now()) {
        throw new Error('Slot currently held by another user');
      }
      // otherwise allow overwrite (expired or rejected)
    }

    const bookingPayload = {
      id: bookingRef.id,
      pitchId,
      date: dateISO,
      startTime,
      startISO: `${dateISO}T${startTime}:00`,
      customerPhone,
      totalAmount,
      status: 'held',
      paymentStatus: 'none',
      lockId,
      createdAt: serverTimestamp(),
      holdExpiresAt,
    } as any;

    tx.set(bookingRef as any, bookingPayload);

    const lockPayload = {
      lockId,
      pitchId,
      bookingRef: bookingRef.id,
      status: 'held',
      createdAt: serverTimestamp(),
      holdExpiresAt,
    } as any;

    tx.set(lockRef as any, lockPayload);

    return { bookingId: bookingRef.id };
  });
}

type ConfirmPaymentParams = {
  storeId: string;
  bookingId: string;
  paymentProofUrl?: string;
  acknowledgedBy?: string;
};

export async function confirmPayment(params: ConfirmPaymentParams) {
  const { storeId, bookingId, paymentProofUrl = '', acknowledgedBy = '' } = params;

  const bookingRef = doc(db, `stores/${storeId}/bookings/${bookingId}`);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef as any);
    if (!snap.exists()) throw new Error('Booking not found');
    const booking: any = snap.data();

    if (booking.paymentStatus === 'paid' || booking.status === 'confirmed') {
      return { ok: true, message: 'Already confirmed' };
    }

    const lockId = booking.lockId as string | undefined;

    tx.update(bookingRef as any, {
      paymentStatus: 'paid',
      status: 'confirmed',
      paymentProofUrl: paymentProofUrl || null,
      confirmedAt: serverTimestamp(),
    });

    if (lockId) {
      const lockRef = doc(db, `stores/${storeId}/slotLocks/${lockId}`);
      tx.update(lockRef as any, {
        status: 'confirmed',
        confirmedAt: serverTimestamp(),
      });
    }

    return { ok: true };
  });
}
