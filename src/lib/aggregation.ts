type Booking = {
  date: string; // YYYY-MM-DD
  totalAmount?: number;
  paymentStatus?: string;
};

type Payment = {
  uploadedAt?: any; // Firestore Timestamp-like or Date
  grossRevenue?: number;
};

export function aggregateWeek(bookings: Booking[], payments: Payment[], startDate: Date, endDate: Date) {
  const perDayMap: Record<string, { date: string; bookingsCount: number; bookingsTotal: number; commissionPaid: number }> = {};
  const dates: string[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate()+1)) {
    const iso = d.toISOString().slice(0,10);
    perDayMap[iso] = { date: iso, bookingsCount: 0, bookingsTotal: 0, commissionPaid: 0 };
    dates.push(iso);
  }

  let totals = { bookingsCount: 0, bookingsTotal: 0, commissionPaid: 0 };

  bookings.forEach(b => {
    const dt = b.date;
    const amt = typeof b.totalAmount === 'number' ? b.totalAmount : 0;
    if (perDayMap[dt]) {
      perDayMap[dt].bookingsCount += 1;
      perDayMap[dt].bookingsTotal += amt;
    }
    totals.bookingsCount += 1;
    totals.bookingsTotal += amt;
  });

  payments.forEach(p => {
    let tMs = 0;
    if (!p.uploadedAt) return;
    if (typeof p.uploadedAt.toDate === 'function') tMs = p.uploadedAt.toDate().getTime();
    else tMs = new Date(p.uploadedAt).getTime();
    const d = new Date(tMs).toISOString().slice(0,10);
    const amt = typeof p.grossRevenue === 'number' ? p.grossRevenue : 0;
    if (perDayMap[d]) {
      perDayMap[d].commissionPaid += amt;
    }
    totals.commissionPaid += amt;
  });

  return {
    perDay: dates.map(d => perDayMap[d]),
    totals,
  };
}
