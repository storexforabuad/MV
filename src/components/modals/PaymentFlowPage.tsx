'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImageToCloudinary } from '@/lib/cloudinaryClient';
import { compressImage } from '@/utils/imageCompression';
import { StoreMeta } from '@/types/store';

interface PaymentFlowPageProps {
  storeMeta: StoreMeta;
  onEvidenceUploaded: (evidenceUrl: string, fileName: string) => void;
  onBack: () => void;
  uploadedEvidence?: { url: string; fileName: string };
}

export default function PaymentFlowPage({
  storeMeta,
  onEvidenceUploaded,
  onBack,
  uploadedEvidence,
}: PaymentFlowPageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankAccountName = storeMeta.bankAccountName || 'Not provided';
  const bankAccountNumber = storeMeta.bankAccountNumber || 'Not provided';
  const bankName = storeMeta.bankName || 'Not provided';
  const storeId = storeMeta.id || '';

  const handleCopyAccountNumber = async () => {
    if (bankAccountNumber === 'Not provided') {
      toast.error('Account number not available');
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(bankAccountNumber);
      } else {
        // Fallback for older browsers: create a textarea and execCommand
        const el = document.createElement('textarea');
        el.value = bankAccountNumber;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }

      setCopiedAccountNumber(true);
      toast.success('Account number copied!');
      setTimeout(() => setCopiedAccountNumber(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
      toast.error('Failed to copy account number');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Compress image first
      const compressedFile = await compressImage(file);

      // Upload to Cloudinary
      const evidenceUrl = await uploadImageToCloudinary(compressedFile, storeId);

      // Callback with evidence
      onEvidenceUploaded(evidenceUrl, file.name);

      toast.success('Payment evidence received! Vendor will review shortly.');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading payment evidence:', error);
      toast.error('Failed to upload payment evidence. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
      >
        ← Back to Summary
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Details Column */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 md:p-6 border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bank Account Details</h3>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <div className="text-xs">Account Holder</div>
              <div className="font-medium text-gray-900 dark:text-white">{bankAccountName}</div>
            </div>
            <div>
              <div className="text-xs">Bank</div>
              <div className="font-medium text-gray-900 dark:text-white">{bankName}</div>
            </div>
            <div>
              <div className="text-xs">Account Number</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 font-mono font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded px-3 py-2 border border-gray-200 dark:border-gray-700 break-all">{bankAccountNumber}</div>
                <button
                  onClick={handleCopyAccountNumber}
                  className={`p-2 rounded-lg transition-all ${copiedAccountNumber ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'}`}
                  title="Copy account number"
                >
                  {copiedAccountNumber ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white dark:bg-gray-800 rounded-md p-3 border border-yellow-200 dark:border-yellow-900/30 text-sm text-gray-700 dark:text-gray-300">
            <div className="font-semibold text-gray-900 dark:text-white mb-1">Steps</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy account number</li>
              <li>Make the payment</li>
              <li>Return and upload proof</li>
            </ol>
          </div>
        </div>

        {/* Upload Column */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Upload Payment Proof</h3>

          {uploadedEvidence ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Payment evidence received</p>
                  <p className="text-xs text-green-700 dark:text-green-300 truncate">{uploadedEvidence.fileName}</p>
                </div>
              </div>

              <div className="relative h-28 w-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                <Image src={uploadedEvidence.url} alt="Payment evidence" fill className="object-cover" />
              </div>

              <div className="flex gap-2">
                <button onClick={handleUploadClick} disabled={isUploading} className="flex-1 py-2 px-3 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-50">{isUploading ? (<><Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />Uploading...</>) : 'Upload Different Image'}</button>
                <button onClick={() => onEvidenceUploaded(uploadedEvidence.url, uploadedEvidence.fileName)} className="py-2 px-3 rounded-md bg-green-600 text-white hover:bg-green-700">Confirm</button>
              </div>
            </div>
          ) : (
            <div onClick={handleUploadClick} className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
              <DocumentArrowDownIcon className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-2" />
              <div className="text-sm font-medium text-gray-900 dark:text-white">{isUploading ? 'Uploading...' : 'Click to upload payment proof'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">PNG, JPG up to 5MB</div>
              {isUploading && <div className="mt-3"><Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" /></div>}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={isUploading} />

      <div className="text-xs text-blue-800 dark:text-blue-200">💡 Tip: Clear, well-lit photos help vendors process orders faster.</div>
    </div>
  );
}
