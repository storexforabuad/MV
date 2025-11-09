
import { StoreOrder } from '../lib/db';

export const calculateCommissionAndBonus = (orders: StoreOrder[]) => {
  let totalCommissionEarned = 0;
  let totalReferralBonus = 0;

  for (const order of orders) {
    if (order.product && order.product.commission && typeof order.product.price === 'number') {
      const commission = (order.product.price * order.product.commission) / 100;
      totalCommissionEarned += commission;

      if (order.referralApplied) {
        totalReferralBonus += commission;
      }
    }
  }

  return { totalCommissionEarned, totalReferralBonus };
};
