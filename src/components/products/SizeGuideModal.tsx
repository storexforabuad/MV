'use client';

import React from 'react';
import { NIGERIAN_SIZE_CHART, EUROPEAN_SHOE_CHART, NIGERIAN_CAP_SIZE_CHART, JALLAB_SIZE_CHART, INSENCE_SIZE_CHART, OIL_PERFUMES_SIZE_CHART, FashionSizeCategory } from '../../utils/sizeUtils';
import Modal from '../Modal';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
  sizeCategory?: FashionSizeCategory;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, selectedSize, sizeCategory = 'clothing' }) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {sizeCategory === 'clothing' ? 'Nigerian Standard Size Guide' : sizeCategory === 'shoes' ? 'European Shoe Size Guide' : sizeCategory === 'caps' ? 'Nigerian Cap Size Guide' : sizeCategory === 'jallabs' ? 'Jallab Size Guide' : sizeCategory === 'insence' ? 'Insence Size Guide' : 'Oil Perfumes Guide'}
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
        {sizeCategory === 'clothing' ? (
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
        ) : sizeCategory === 'shoes' ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Size (EU)
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Foot Length (cm)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {EUROPEAN_SHOE_CHART.map((sizeData) => (
                <tr
                  key={sizeData.size}
                  className={selectedSize === sizeData.size ? 'bg-blue-50 dark:bg-blue-900/50' : ''}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {sizeData.size}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {sizeData.footLength}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : sizeCategory === 'caps' ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Size (Inches)
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Circumference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {NIGERIAN_CAP_SIZE_CHART.map((sizeData) => (
                <tr
                  key={sizeData.size}
                  className={selectedSize === sizeData.size ? 'bg-blue-50 dark:bg-blue-900/50' : ''}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {sizeData.size}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {sizeData.size}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : sizeCategory === 'jallabs' ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Jallab Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {JALLAB_SIZE_CHART.map((sizeData) => (
                <tr
                  key={sizeData.size}
                  className={selectedSize === sizeData.size ? 'bg-blue-50 dark:bg-blue-900/50' : ''}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {sizeData.size}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : sizeCategory === 'insence' ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Insence Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {INSENCE_SIZE_CHART.map((sizeData) => (
                <tr
                  key={sizeData.size}
                  className={selectedSize === sizeData.size ? 'bg-blue-50 dark:bg-blue-900/50' : ''}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {sizeData.size}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Oil Perfume Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {OIL_PERFUMES_SIZE_CHART.map((sizeData) => (
                <tr
                  key={sizeData.size}
                  className={selectedSize === sizeData.size ? 'bg-blue-50 dark:bg-blue-900/50' : ''}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {sizeData.size}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          {sizeCategory === 'clothing'
            ? 'Note: Measurements are in inches. This chart is a guide; sizes may vary slightly between brands.'
            : sizeCategory === 'shoes'
              ? 'Note: Measure your foot length in cm to find your size. Sizes may vary by brand.'
              : sizeCategory === 'caps'
                ? 'Note: Measure the circumference of your head in inches to find your cap size.'
                : sizeCategory === 'jallabs'
                  ? 'Note: Jallab sizes range from 52-62. Choose based on your usual sizing.'
                  : sizeCategory === 'insence'
                    ? 'Note: Standard insence sizes.'
                    : 'Note: Standard oil perfumes sizes.'}
        </p>
      </div>
    </Modal>
  );
};

export default SizeGuideModal;
