"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useVendor } from '@/context/VendorContext';
import { aggregateWeek } from '@/lib/aggregation';

function startOfIsoWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function formatISODate(d: Date) {
  return d.toISOString().slice(0,10);
}

export default function AdminInvoicePanel({ storeId }: { storeId: string }) {
  const { vendor, promptLogin } = useVendor();
  const [weekAnchor, setWeekAnchor] = useState(() => startOfIsoWeek(new Date()));
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const startDate = useMemo(() => startOfIsoWeek(weekAnchor), [weekAnchor]);
  const endDate = useMemo(() => {
    const e = new Date(startDate);
    e.setDate(e.getDate() + 6);
    e.setHours(23,59,59,999);
    return e;
  }, [startDate]);

  useEffect(() => {
    if (!vendor) return;
    if (vendor.storeId !== storeId) {
      promptLogin(storeId);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const startISO = formatISODate(startDate);
        const endISO = formatISODate(endDate);
        const bookingsQ = query(collection(db, `stores/${storeId}/bookings`), where('date','>=', startISO), where('date','<=', endISO), orderBy('date'), limit(1000) as any);
        const paymentsQ = query(collection(db, `stores/${storeId}/commissionPayments`), orderBy('uploadedAt','desc'), limit(1000) as any);

        const [bSnap, pSnap] = await Promise.all([getDocs(bookingsQ as any), getDocs(paymentsQ as any)]);
        const bs = bSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        const ps = pSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

        const sMs = startDate.getTime();
        const eMs = endDate.getTime();
        const filteredPayments = ps.filter((p: any) => {
          if (!p.uploadedAt) return false;
          const t = (p.uploadedAt.toDate ? p.uploadedAt.toDate().getTime() : (new Date(p.uploadedAt)).getTime());
          return t >= sMs && t <= eMs;
        });

        setBookings(bs as any[]);
        setPayments(filteredPayments as any[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [storeId, startDate, endDate, vendor, promptLogin]);

  const report = useMemo(() => aggregateWeek(bookings, payments, startDate, endDate), [bookings, payments, startDate, endDate]);

  const exportCsv = () => {
    const rows = [ ['date','bookingsCount','bookingsTotal','commissionPaid'] ];
    report.perDay.forEach(r => rows.push([r.date, String(r.bookingsCount), String(r.bookingsTotal), String(r.commissionPaid)]));
    rows.push(['TOTAL', String(report.totals.bookingsCount), String(report.totals.bookingsTotal), String(report.totals.commissionPaid)]);
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${formatISODate(startDate)}_to_${formatISODate(endDate)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!vendor) return (
    <div className="p-4">
      <div className="text-sm">Vendor not logged in.</div>
      <button className="btn btn-primary mt-2" onClick={() => promptLogin(storeId)}>Sign in as vendor</button>
    </div>
  );

  if (vendor.storeId !== storeId) return (
    <div className="p-4">
      <div className="text-sm">You are signed in as vendor for <strong>{vendor.storeId}</strong>. Please sign in for this store.</div>
      <button className="btn btn-secondary mt-2" onClick={() => promptLogin(storeId)}>Switch store</button>
    </div>
  );

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <button className="px-2" onClick={() => setWeekAnchor(d => { const nd = new Date(d); nd.setDate(nd.getDate()-7); return nd; })}>{'<'}</button>
          <span className="mx-3 font-medium">{formatISODate(startDate)} → {formatISODate(endDate)}</span>
          <button className="px-2" onClick={() => setWeekAnchor(d => { const nd = new Date(d); nd.setDate(nd.getDate()+7); return nd; })}>{'>'}</button>
        </div>
        <div>
          <button className="btn btn-outline mr-2" onClick={() => window.location.reload()}>Refresh</button>
          <button className="btn btn-primary" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      {loading ? <div>Loading…</div> : (
        <div>
          <div className="mb-3">Total Bookings: <strong>{report.totals.bookingsCount}</strong> — Amount: <strong>NGN {report.totals.bookingsTotal}</strong></div>
          <div className="mb-3">Commission Paid: <strong>NGN {report.totals.commissionPaid}</strong></div>

          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left"><th>Date</th><th>Bookings</th><th>Bookings Total</th><th>Commission Paid</th></tr>
            </thead>
            <tbody>
              {report.perDay.map(r => (
                <tr key={r.date} className="border-t">
                  <td>{r.date}</td>
                  <td>{r.bookingsCount}</td>
                  <td>NGN {r.bookingsTotal}</td>
                  <td>NGN {r.commissionPaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
