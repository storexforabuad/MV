"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collectionGroup, collection, query, orderBy, limit, getDocs, doc } from 'firebase/firestore';
import { acknowledgeCommission, rejectCommission } from '@/app/actions/commissionPaymentActions';

interface PaymentItem {
  id: string;
  storeId: string;
  amount: number;
  uploadedAt?: any;
  proofUrl?: string | null;
  notes?: string | null;
  status?: string;
}

interface Props {
  storeId?: string;
}

export default function DevTeamCommissionPayments({ storeId }: Props) {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let q;
      if (storeId) {
        q = query(collection(db, `stores/${storeId}/commissionPayments`), orderBy('uploadedAt', 'desc'), limit(50));
      } else {
        q = query(collectionGroup(db, 'commissionPayments'), orderBy('uploadedAt', 'desc'), limit(50));
      }
      const snaps = await getDocs(q as any);
      const results: PaymentItem[] = snaps.docs.map((d) => {
        const p: any = d.data();
        // derive storeId from path: stores/{storeId}/commissionPayments/{id}
        const parts = d.ref.path.split('/');
        const sId = parts[1] || '';
        return {
          id: d.id,
          storeId: sId,
          amount: p.grossRevenue || p.amount || 0,
          uploadedAt: p.uploadedAt,
          proofUrl: p.proofUrl || null,
          notes: p.remittanceReference || p.notes || null,
          status: p.status || 'submitted',
        };
      });
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleAck = async (item: PaymentItem) => {
    try {
      await acknowledgeCommission({ storeId: item.storeId, paymentId: item.id, acknowledgedBy: 'devteam' });
      await load();
      alert('Acknowledged');
    } catch (err) {
      console.error(err);
      alert('Failed to acknowledge');
    }
  };

  const handleReject = async (item: PaymentItem) => {
    const reason = prompt('Rejection reason (optional)') || '';
    try {
      await rejectCommission({ storeId: item.storeId, paymentId: item.id, rejectedBy: 'devteam', reason });
      await load();
      alert('Rejected');
    } catch (err) {
      console.error(err);
      alert('Failed to reject');
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Commission Payments</h3>
        <button className="text-sm text-blue-600" onClick={load}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">List of recent submissions with proof and actions.</p>

      <div className="mt-4">
        {items.length === 0 && <div className="text-sm text-gray-600">No submissions</div>}
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={`${it.storeId}-${it.id}`} className="flex items-start gap-3 p-3 border rounded">
              <div className="w-20 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {it.proofUrl ? <img src={it.proofUrl} alt="proof" className="w-full h-full object-cover" /> : <div className="p-2 text-xs text-gray-500">No proof</div>}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Store: <span className="font-normal">{it.storeId}</span></div>
                <div className="text-sm">Amount: NGN {it.amount}</div>
                <div className="text-sm text-gray-500">Notes: {it.notes || '—'}</div>
                <div className="text-xs text-gray-400">Status: {it.status}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm" onClick={() => handleAck(it)}>Acknowledge</button>
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm" onClick={() => handleReject(it)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
