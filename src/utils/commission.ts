import { addYears } from 'date-fns';

export function commissionEndDate(referralDate: Date, years = 5) {
  return addYears(referralDate, years);
}

export function remainingWeeksUntil(referralDate: Date, years = 5) {
  const end = commissionEndDate(referralDate, years).getTime();
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil(Math.max(0, end - now) / msPerWeek);
  return remaining;
}

export function projectedTotalFromWeekly(weeklyAmount: number, years = 5) {
  return weeklyAmount * 52 * years;
}
