import { aggregateWeek } from './aggregation';

function makeBooking(date: string, amount = 100, paymentStatus = 'paid') {
  return { date, totalAmount: amount, paymentStatus };
}

function makePayment(dateISO: string, amount = 50) {
  return { uploadedAt: new Date(dateISO + 'T12:00:00Z'), grossRevenue: amount };
}

function approxEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function runAggregationTests() {
  const start = new Date('2025-12-22'); // Monday
  const end = new Date('2025-12-28');

  const bookings = [
    makeBooking('2025-12-22', 200),
    makeBooking('2025-12-23', 100),
    makeBooking('2025-12-24', 150),
  ];

  const payments = [
    makePayment('2025-12-22', 200),
    makePayment('2025-12-24', 150),
  ];

  const report = aggregateWeek(bookings as any, payments as any, start, end);

  console.log('Aggregation report:', report.totals);

  if (report.totals.bookingsCount !== 3) throw new Error('Expected 3 bookings');
  if (report.totals.bookingsTotal !== 450) throw new Error('Expected total 450');
  if (report.totals.commissionPaid !== 350) throw new Error('Expected commissionPaid 350');

  console.log('aggregation tests passed');
}

if (require.main === module) {
  runAggregationTests();
}
