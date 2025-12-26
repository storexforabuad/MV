"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useVendor } from '@/context/VendorContext';
import { submitCommissionPayment } from '@/app/actions/commissionPaymentActions';
import { storage } from '@/lib/firebase';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface PayCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

export default function PayCommissionModal({ isOpen, onClose, storeId }: PayCommissionModalProps) {
  const { vendor, promptLogin } = useVendor();
  const [amount, setAmount] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!vendor || vendor.storeId !== storeId) {
        promptLogin(storeId);
        setIsSubmitting(false);
        return;
      }
      const amt = typeof amount === 'number' ? amount : Number(amount || 0);
      let proofUrl: string | null = null;
      if (file) {
        const path = `stores/${storeId}/commissionProofs/${Date.now()}_${file.name}`;
        const ref = sRef(storage, path);
        await uploadBytes(ref, file);
        proofUrl = await getDownloadURL(ref);
      }

      const res = await submitCommissionPayment({
        storeId,
        amount: amt,
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        accountNumber: '',
        accountName: '',
        proofFilePath: proofUrl || undefined,
        notes,
        uploadedBy: vendor?.id || vendor?.phone || undefined,
      });
      onClose();
      alert(res?.ok ? `Submitted (${res.paymentId || 'id:N/A'})` : 'Submission failed');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-bold mb-2">Pay Commission</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Send payment to: <strong>8119772223 — Mustapha Gambo Lawal — Opay</strong></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount Paid (NGN)</label>
            <input type="number" min={0} value={amount as any} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Upload Payment Confirmation</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes / Reference (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white">{isSubmitting ? 'Submitting...' : 'Submit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
