import React from 'react';

interface NairaProps {
  amount: number;
}

export const Naira: React.FC<NairaProps> = ({ amount }) => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  });

  return <span>{formatter.format(amount)}</span>;
};
