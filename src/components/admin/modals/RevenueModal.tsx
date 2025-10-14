import { Banknote } from 'lucide-react';

interface RevenueModalProps {
  totalRevenue: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function RevenueModal({ totalRevenue }: RevenueModalProps) {
  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-slate-800 rounded-2xl text-center">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/50 rounded-full border-4 border-green-200 dark:border-green-800">
        <Banknote className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Estimated Revenue
      </h2>
      <p className="mt-2 text-4xl font-extrabold text-green-600 dark:text-green-400">
        {formatCurrency(totalRevenue)}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        This is the total potential revenue from selling all your current products at their listed prices.
      </p>
    </div>
  );
}
