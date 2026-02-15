'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer, CheckCircle2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInvoiceData, markInvoiceAsSettled } from '@/app/actions/wholesaleInvoiceActions';
import { WholesaleInvoice, WholesaleOrder } from '@/types/wholesale';
import { StoreMeta } from '@/types/store';

// Helper function to convert Firestore Timestamp to Date
const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  return new Date(timestamp);
};

interface WholesaleInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  storeId: string;
  isSellerView?: boolean;
}

export default function WholesaleInvoiceModal({
  isOpen,
  onClose,
  invoiceId,
  storeId,
  isSellerView = true
}: WholesaleInvoiceModalProps) {
  const [invoice, setInvoice] = useState<WholesaleInvoice & { id: string } | null>(null);
  const [sellerStore, setSellerStore] = useState<StoreMeta | null>(null);
  const [buyerStore, setBuyerStore] = useState<StoreMeta | null>(null);
  const [orders, setOrders] = useState<(WholesaleOrder & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Fetch invoice data on mount
  useEffect(() => {
    if (!isOpen || !invoiceId || !storeId) return;

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getInvoiceData(invoiceId, storeId);
        if (mounted) {
          if (data.error) {
            toast.error(data.error);
          } else {
            setInvoice(data.invoice);
            setSellerStore(data.sellerStore);
            setBuyerStore(data.buyerStore);
            setOrders(data.orders);
          }
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        if (mounted) {
          toast.error('Failed to load invoice');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [isOpen, invoiceId, storeId]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      toast.loading('Generating PDF...');
      
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = invoiceRef.current;
      const opt = {
        margin: 10,
        filename: `Invoice-${invoice?.invoiceNumber || invoiceId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(opt).from(element).save();
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;

    try {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Invoice</title>');
        printWindow.document.write(
          '<style> body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; } </style>'
        );
        printWindow.document.write('</head><body>');
        printWindow.document.write(invoiceRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error printing:', error);
      toast.error('Failed to print invoice');
    }
  };

  const handleMarkAsSettled = async () => {
    if (!invoice || invoice.status === 'settled') return;

    setIsSettling(true);
    try {
      const result = await markInvoiceAsSettled(invoice.id, storeId);
      if (result.success) {
        toast.success('Invoice marked as settled');
        setInvoice({ ...invoice, status: 'settled' });
      } else {
        toast.error(result.error || 'Failed to mark invoice as settled');
      }
    } catch (error) {
      console.error('Error marking invoice as settled:', error);
      toast.error('Failed to mark invoice as settled');
    } finally {
      setIsSettling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">Invoice {invoice?.invoiceNumber}</h2>
              <p className="text-blue-100 text-sm">
                {invoice?.invoicePeriod?.startDate && toDate(invoice.invoicePeriod.startDate).toLocaleDateString()} -{' '}
                {invoice?.invoicePeriod?.endDate && toDate(invoice.invoicePeriod.endDate).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : invoice && sellerStore && buyerStore ? (
            <>
              {/* Invoice Content */}
              <div ref={invoiceRef} className="p-8 space-y-8 print:p-4">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">INVOICE</h1>
                    <p className="text-sm text-slate-600">Invoice #: {invoice.invoiceNumber}</p>
                    <p className="text-sm text-slate-600">
                      Date: {invoice.createdAt && toDate(invoice.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      Due Date: {invoice.dueDate && toDate(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {invoice.status === 'settled' && (
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        SETTLED
                      </span>
                    )}
                    {invoice.status === 'pending' && (
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        PENDING
                      </span>
                    )}
                    {invoice.status === 'overdue' && (
                      <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>

                {/* Seller and Buyer Details */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">FROM</h3>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{sellerStore.name}</p>
                      <p className="text-sm text-slate-600">{sellerStore.storeType || 'Vendor'}</p>
                      <p className="text-sm text-slate-600">{sellerStore.state || sellerStore.country || 'Location TBA'}</p>
                      {isSellerView && (
                        <>
                          <p className="text-sm text-slate-600 mt-2">Email: {sellerStore.ceoEmail || 'N/A'}</p>
                          <p className="text-sm text-slate-600">Phone: {sellerStore.ceoPhone || sellerStore.whatsapp || 'N/A'}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">TO</h3>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{buyerStore.name}</p>
                      <p className="text-sm text-slate-600">{buyerStore.storeType || 'Vendor'}</p>
                      <p className="text-sm text-slate-600">{buyerStore.state || buyerStore.country || 'Location TBA'}</p>
                      <p className="text-sm text-slate-600 mt-2">Email: {buyerStore.ceoEmail || 'N/A'}</p>
                      <p className="text-sm text-slate-600">Phone: {buyerStore.ceoPhone || buyerStore.whatsapp || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Order #</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Items</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Qty</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Unit Price</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, idx) => {
                        const totalQty = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                        const subtotal = order.items?.reduce((sum: number, item: any) => sum + item.lineTotal, 0) || 0;
                        const total = order.total || subtotal;

                        return (
                          <tr key={order.id} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="py-3 px-4 text-sm text-slate-900 font-mono">{order.id.slice(0, 8)}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {order.createdAt && toDate(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900 text-right font-semibold">{totalQty}</td>
                            <td className="py-3 px-4 text-sm text-slate-600 text-right">
                              ₦{(subtotal / totalQty).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-900 text-right font-semibold">
                              ₦{total.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-3 border-t-2 border-slate-300 pt-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold text-slate-900">
                        ₦{(invoice.subtotal || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Platform Fee (5%):</span>
                      <span className="font-semibold text-slate-900">
                        ₦{(invoice.platformFeeTotal || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-3">
                      <span>Total Due:</span>
                      <span className="text-blue-600">
                        ₦{(invoice.total || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Terms Footer */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Payment Terms</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Payment is due within{' '}
                    {invoice.paymentTermsDays === 0
                      ? 'immediately upon receipt'
                      : `${invoice.paymentTermsDays} days from invoice date`}
                    .
                  </p>
                  {isSellerView && (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                        Bank Details (95% Settlement):
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {sellerStore.bankAccountName || 'Account Name TBA'} | {sellerStore.bankAccountNumber || 'XXXX'} | {sellerStore.bankName || 'Bank TBA'}
                      </p>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-500 border-t border-slate-200 pt-6 print:mt-12">
                  <p>Thank you for your business</p>
                  <p className="mt-1">This is an automatically generated invoice</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 flex justify-end gap-3 print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                {isSellerView && invoice.status !== 'settled' && (
                  <button
                    onClick={handleMarkAsSettled}
                    disabled={isSettling}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isSettling ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Mark Settled
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-600">Invoice not found</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
