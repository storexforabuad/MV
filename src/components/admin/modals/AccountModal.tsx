'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/db';
import { toast } from 'react-hot-toast';

interface AccountModalProps {
  isOpen?: boolean;
  handleClose?: () => void;
  storeId: string;
}

export default function AccountModal({ isOpen = true, handleClose, storeId }: AccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    if (!storeId) return;
    let mounted = true;
    (async () => {
      try {
        const ref = doc(db, 'stores', storeId);
        const snap = await getDoc(ref);
        if (snap.exists() && mounted) {
          const data = snap.data() as any;
          setBankAccountName(data.bankAccountName || '');
          setBankAccountNumber(data.bankAccountNumber || '');
          setBankName(data.bankName || '');
        }
      } catch (err) {
        console.error('Failed to load account info', err);
      }
    })();
    return () => { mounted = false; };
  }, [storeId]);

  const handleSave = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const ref = doc(db, 'stores', storeId);
      await updateDoc(ref, {
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankName: bankName || null,
      });
      toast.success('Account details saved');
      if (handleClose) handleClose();
    } catch (err) {
      console.error('Failed to save account details', err);
      toast.error('Failed to save account details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full p-6">
      <h3 className="text-xl font-bold mb-3">Account Details</h3>
      <p className="text-sm text-text-secondary mb-4">Provide bank details to receive payouts.</p>

      <div className="space-y-3">
        <label className="text-xs font-medium">Account Name</label>
        <input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="e.g. John Doe" />

        <label className="text-xs font-medium">Account Number</label>
        <input value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="e.g. 0123456789" />

        <label className="text-xs font-medium">Bank Name</label>
        <input value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" placeholder="e.g. First Bank" />

        <div className="flex gap-2 mt-4">
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-green-500 text-white py-2 rounded-lg">{loading ? 'Saving...' : 'Save'}</button>
          <button onClick={handleClose} className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}
