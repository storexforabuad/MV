import React from 'react';

interface NairaProps {
  amount?: number;
  className?: string;
}

export const Naira: React.FC<NairaProps> = ({ amount, className }) => {
  if (amount !== undefined) {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    });
    return <span className={className}>{formatter.format(amount)}</span>;
  }

  return <span className={className}>₦</span>;
};
