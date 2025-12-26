// Server-action placeholders for commission payments
// Implement actual storage upload and Firestore writes in these functions.

import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function submitCommissionPayment(params: {
  storeId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  accountNumber: string;
  accountName: string;
  proofFilePath?: string;
  notes?: string;
  uploadedBy?: string;
}) {
  const { storeId, amount, periodStart, periodEnd, accountNumber, accountName, proofFilePath, notes, uploadedBy } = params;
  const paymentId = Date.now().toString();
  const paymentsCol = doc(db, `stores/${storeId}/commissionPayments/${paymentId}`);
  await runTransaction(db, async (tx) => {
    tx.set(paymentsCol as any, {
      fiscalPeriod: { startDate: periodStart, endDate: periodEnd },
      grossRevenue: amount,
      commissionRate: null,
      platformCommissionAmount: amount,
      amountPaidByVendor: amount,
      accountNumber,
      accountName,
      remittanceReference: notes || null,
      proofUrl: proofFilePath || null,
      uploadedBy: uploadedBy || null,
      uploadedAt: serverTimestamp(),
      status: 'submitted',
    });
  });
  return { ok: true, paymentId };
}

export async function acknowledgeCommission(params: { storeId: string; paymentId: string; acknowledgedBy: string; }) {
  const { storeId, paymentId, acknowledgedBy } = params;
  const paymentRef = doc(db, `stores/${storeId}/commissionPayments/${paymentId}`);
  const storeRef = doc(db, `stores/${storeId}`);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(paymentRef as any);
    if (!snap.exists()) throw new Error('Payment not found');
    const data: any = snap.data();
    if (data.status === 'acknowledged') return;

    tx.update(paymentRef as any, { status: 'acknowledged', acknowledgedBy, acknowledgedAt: serverTimestamp() });
    tx.update(storeRef as any, { lastPaidAt: serverTimestamp() });
  });

  return { ok: true };
}

export async function rejectCommission(params: { storeId: string; paymentId: string; rejectedBy: string; reason?: string; }) {
  const { storeId, paymentId, rejectedBy, reason } = params;
  const paymentRef = doc(db, `stores/${storeId}/commissionPayments/${paymentId}`);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(paymentRef as any);
    if (!snap.exists()) throw new Error('Payment not found');
    const data: any = snap.data();
    if (data.status === 'rejected') return;

    tx.update(paymentRef as any, { status: 'rejected', rejectedBy, rejectedAt: serverTimestamp(), rejectedReason: reason || null });
  });

  return { ok: true };
}
