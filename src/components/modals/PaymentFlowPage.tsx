'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImageToCloudinary } from '@/lib/cloudinaryClient';
import { compressImage } from '@/utils/imageCompression';
import { StoreMeta } from '@/types/store';

import { formatPrice } from '@/utils/price';

interface PaymentFlowPageProps {
  storeMeta: StoreMeta;
  onEvidenceUploaded: (evidenceUrl: string, fileName: string) => void;
  onBack: () => void;
  uploadedEvidence?: { url: string; fileName: string };
  total: number;
}

export default function PaymentFlowPage({
  storeMeta,
  onEvidenceUploaded,
  onBack,
  uploadedEvidence,
  total,
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
        // Fallback for older browsers
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const evidenceUrl = await uploadImageToCloudinary(compressedFile, storeId);
      onEvidenceUploaded(evidenceUrl, file.name);
      toast.success('Payment evidence received!');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading payment evidence:', error);
      toast.error('Failed to upload payment evidence.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1 transition-colors"
        >
          ← Back to Summary
        </button>

        {/* Total Amount Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 md:p-6 text-white shadow-lg transform transition-all hover:scale-[1.01]">
          <div className="flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-green-100 text-sm font-medium uppercase tracking-wider">Total Amount to Pay</span>
            <span className="text-3xl md:text-4xl font-bold tracking-tight">{formatPrice(total)}</span>
            <div className="h-1 w-12 bg-green-400/30 rounded-full mt-2"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Details Column */}
        <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-4 md:p-5 border border-green-100 dark:border-green-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <DocumentArrowDownIcon className="w-5 h-5" />
            </span>
            Bank Details
          </h3>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800/30 shadow-sm space-y-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bank Name</div>
                <div className="font-medium text-gray-900 dark:text-white text-lg">{bankName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Holder</div>
                <div className="font-medium text-gray-900 dark:text-white text-lg">{bankAccountName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Account Number</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono font-bold text-xl text-gray-900 dark:text-white tracking-wider">{bankAccountNumber}</div>
                  <button
                    onClick={handleCopyAccountNumber}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copiedAccountNumber ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'}`}
                    title="Copy account number"
                  >
                    {copiedAccountNumber ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/20 mt-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 text-xs">i</span>
                Payment Instructions
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm">1</div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 pt-0.5">Copy the account number above</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm">2</div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 pt-0.5">Make a transfer of <span className="font-bold">{formatPrice(total)}</span></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm">3</div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 pt-0.5">Upload your proof of payment below</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Column */}
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="p-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
              <CheckCircleIcon className="w-5 h-5" />
            </span>
            Upload Proof
          </h3>

          {uploadedEvidence ? (
            <div className="space-y-4">
              <div className="relative h-40 w-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                <Image src={uploadedEvidence.url} alt="Payment evidence" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium">Change Image</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="font-medium truncate">{uploadedEvidence.fileName}</span>
              </div>

              <button
                onClick={handleUploadClick}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Upload different image
              </button>
            </div>
          ) : (
            <div
              onClick={handleUploadClick}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group
                ${isUploading
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                  : 'border-gray-300 dark:border-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
            >
              <div className={`p-3 rounded-full mb-3 transition-colors ${isUploading ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-green-100 dark:bg-gray-800'}`}>
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                ) : (
                  <DocumentArrowDownIcon className="h-6 w-6 text-gray-400 group-hover:text-green-600 transition-colors" />
                )}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {isUploading ? 'Uploading...' : 'Tap to upload receipt'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Supports JPG, PNG
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={isUploading} />
    </div>
  );
}
