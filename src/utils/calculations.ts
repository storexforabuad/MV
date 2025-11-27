
import { StoreOrder } from '../lib/db';

export const calculateCommissionAndBonus = (orders: StoreOrder[]) => {
  let totalCommissionEarned = 0;
  let totalReferralBonus = 0;

  for (const order of orders) {
    // Only calculate commission and bonus for orders that are ready (in delivery hub)
    if (order.orderStatus !== 'ready') continue;

    for (const product of order.products) {
      if (product.commission && typeof product.price === 'number') {
        const commission = (product.price * product.commission) / 100;
        totalCommissionEarned += commission;

        if (order.referralApplied) {
          totalReferralBonus += commission;
        }
      }
    }
  }

  return { totalCommissionEarned, totalReferralBonus };
};
