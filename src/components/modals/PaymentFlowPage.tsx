'use client';

import { useState, useRef, Fragment } from 'react';
import Image from 'next/image';
import { XMarkIcon, DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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

  const handleCopyAccountNumber = () => {
    if (bankAccountNumber === 'Not provided') {
      toast.error('Account number not available');
      return;
    }

    navigator.clipboard.writeText(bankAccountNumber);
    setCopiedAccountNumber(true);
    toast.success('Account number copied!');

    setTimeout(() => setCopiedAccountNumber(false), 2000);
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
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
      >
        ← Back to Summary
      </button>

      {/* Bank Details Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bank Account Details
        </h3>

        <div className="space-y-4">
          {/* Account Name */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Holder Name</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{bankAccountName}</p>
          </div>

          {/* Bank Name */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bank Name</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">{bankName}</p>
          </div>

          {/* Account Number with Copy Button */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Number</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-300 dark:border-gray-700">
                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white break-all">
                  {bankAccountNumber}
                </p>
              </div>
              <button
                onClick={handleCopyAccountNumber}
                className={`p-2 rounded-lg transition-all ${
                  copiedAccountNumber
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                }`}
                title="Copy account number"
              >
                {copiedAccountNumber ? (
                  <Check size={20} />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-semibold text-gray-900 dark:text-white">Steps:</span>
            <br />
            1. Copy the account number above<br />
            2. Minimize the app and make the payment<br />
            3. Return to the app and upload proof of payment<br />
            4. Vendor will verify and process your order
          </p>
        </div>
      </div>

      {/* Payment Evidence Upload Section */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Payment Proof
        </h3>

        {uploadedEvidence ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Payment evidence received!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 truncate">
                  {uploadedEvidence.fileName}
                </p>
              </div>
            </div>

            {/* Show uploaded image preview */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={uploadedEvidence.url}
                alt="Payment evidence"
                fill
                className="object-cover"
              />
            </div>

            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full py-2 px-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Different Image'
              )}
            </button>
          </div>
        ) : (
          <div
            onClick={handleUploadClick}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
          >
            <DocumentArrowDownIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
              {isUploading ? 'Uploading...' : 'Click to upload payment proof'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Screenshot or photo of your bank transfer receipt
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              PNG, JPG up to 5MB
            </p>

            {isUploading && (
              <div className="mt-4 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 <span className="font-medium">Tip:</span> Clear, well-lit photos of your transaction receipt help vendors process orders faster.
        </p>
      </div>
    </div>
  );
}
