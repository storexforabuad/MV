'use client';

import React from 'react';
import { NIGERIAN_SIZE_CHART } from '../../utils/sizeUtils';
import Modal from '../Modal';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, selectedSize }) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Nigerian Standard Size Guide
        </Dialog.Title>
        <button
            type="button"
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={onClose}
        >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      <div className="overflow-x-auto pt-2">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Size
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Bust (in)
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Waist (in)
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hips (in)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {NIGERIAN_SIZE_CHART.map((sizeData) => (
              <tr 
                key={sizeData.size} 
                className={selectedSize === sizeData.size ? 'bg-blue-50 dark:bg-blue-900/50' : ''}
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {sizeData.size}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {sizeData.bust}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {sizeData.waist}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {sizeData.hips}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Note: Measurements are in inches. This chart is a guide; sizes may vary slightly between brands.
        </p>
      </div>
    </Modal>
  );
};

export default SizeGuideModal;