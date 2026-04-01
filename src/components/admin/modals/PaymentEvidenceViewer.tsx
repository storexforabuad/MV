'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface PaymentEvidenceViewerProps {
  paymentEvidenceUrl?: string;
  paymentEvidenceFileName?: string;
  paymentEvidenceUploadedAt?: string;
  paymentStatus?: 'pending' | 'submitted' | 'escrow-held' | 'escrow-released' | 'escrow-disputed' | 'refunded';
}

export default function PaymentEvidenceViewer({
  paymentEvidenceUrl,
  paymentEvidenceFileName,
  paymentEvidenceUploadedAt,
  paymentStatus,
}: PaymentEvidenceViewerProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Don't render if no evidence URL
  if (!paymentEvidenceUrl) {
    return null;
  }

  const uploadDate = paymentEvidenceUploadedAt
    ? new Date(paymentEvidenceUploadedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Unknown';

  return (
    <>
      {/* Evidence Card */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Payment Evidence Received
              </h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {paymentEvidenceFileName || 'Payment proof'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Uploaded on {uploadDate}
            </p>
          </div>

          {/* View button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="ml-2 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex-shrink-0"
            title="View payment evidence"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${paymentStatus === 'submitted'
                  ? 'bg-yellow-500'
                  : paymentStatus === 'escrow-disputed'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {paymentStatus === 'submitted'
                ? 'Awaiting vendor verification'
                : paymentStatus === 'escrow-disputed'
                  ? 'Payment Disputed'
                  : 'Pending payment'}
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Transition.Root show={isLightboxOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsLightboxOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-90" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative w-full max-w-4xl">
                {/* Close button */}
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
                  title="Close"
                >
                  <XMarkIcon className="h-8 w-8" />
                </button>

                {/* Image container */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <Image
                    src={paymentEvidenceUrl}
                    alt="Payment evidence"
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain max-h-[80vh]"
                    priority
                  />
                </div>

                {/* Image info footer */}
                <div className="mt-4 text-center text-white text-sm">
                  <p>{paymentEvidenceFileName || 'Payment proof'}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Uploaded on {uploadDate}
                  </p>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
