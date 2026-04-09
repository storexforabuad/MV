'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Camera, RefreshCw, CheckCircle2, AlertCircle, ScanLine } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/db';
import { toast } from 'react-hot-toast';

interface TicketScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    brandOrderId: string; // The ID of the B2B promo order that owns this scanning session
    onScanSuccess?: () => void;
}

export default function TicketScannerModal({ isOpen, onClose, brandOrderId, onScanSuccess }: TicketScannerModalProps) {
    const [isScanning, setIsScanning] = useState(true);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleScan = async (result: any) => {
        if (!result || isProcessing || !isScanning) return;

        setIsProcessing(true);
        setIsScanning(false);

        try {
            const data = JSON.parse(result[0].rawValue);
            const { orderId } = data;

            if (!orderId) {
                throw new Error('Invalid QR Code format.');
            }

            // 1. Fetch the ticket order
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                throw new Error('Ticket not found in system.');
            }

            const orderData = orderSnap.data();

            // 2. Security Check: Does this ticket belong to THIS brand's event?
            const ticketProduct = orderData.products?.[0];
            if (ticketProduct?.brandOrderRef !== brandOrderId) {
                throw new Error('This ticket is not valid for this event.');
            }

            // 3. Validation: Already scanned?
            if (orderData.scanned) {
                setScanResult({
                    success: false,
                    message: `Already Scanned at ${new Date(orderData.scannedAt?.toMillis?.() || orderData.scannedAt).toLocaleTimeString()}`,
                    data: orderData
                });
                return;
            }

            // 4. Update Database
            await updateDoc(orderRef, {
                scanned: true,
                scannedAt: new Date().toISOString()
            });

            // 5. Increment counter on Brand's Promo Order
            const brandOrderRef = doc(db, 'orders', brandOrderId);
            await updateDoc(brandOrderRef, {
                scannedCount: increment(1)
            });

            setScanResult({
                success: true,
                message: 'Access Granted!',
                data: orderData
            });

            if (onScanSuccess) onScanSuccess();
            toast.success('Ticket Validated!');

        } catch (err: any) {
            console.error('Scan Error:', err);
            setScanResult({
                success: false,
                message: err.message || 'Validation Failed'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setIsScanning(true);
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-0 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-full" enterTo="opacity-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-full">
                            <Dialog.Panel className="relative w-full max-w-lg h-screen sm:h-auto sm:rounded-[3rem] bg-gray-900 text-white overflow-hidden flex flex-col shadow-2xl">

                                {/* Header */}
                                <div className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">Ticket Scanner</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Entry Validation Mode</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-full bg-gray-800 text-gray-400">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Scanner Area */}
                                <div className="relative flex-1 flex flex-col items-center justify-center p-6 bg-black">
                                    {isScanning ? (
                                        <div className="w-full max-w-sm aspect-square relative rounded-3xl overflow-hidden border-2 border-indigo-500/30">
                                            <Scanner
                                                onScan={handleScan}
                                                onError={(err) => console.error(err)}
                                                styles={{ container: { width: '100%', height: '100%' } }}
                                            />

                                            {/* Scanning UI Overlays */}
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/20 rounded-2xl" />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-scan-move" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-sm aspect-square rounded-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                                            {isProcessing ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <RefreshCw className="w-16 h-16 text-indigo-500 animate-spin" />
                                                    <p className="font-bold text-lg">Validating Ticket...</p>
                                                </div>
                                            ) : scanResult?.success ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                                                        <CheckCircle2 className="w-12 h-12 text-white" />
                                                    </div>
                                                    <h2 className="text-3xl font-black text-green-400 mt-2">{scanResult.message}</h2>
                                                    <div className="mt-4 p-4 rounded-2xl bg-gray-800 text-left w-full">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Attendee Name</p>
                                                        <p className="font-bold text-white uppercase text-lg">{scanResult.data?.customerInfo?.name || 'Guest'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 text-red-400">
                                                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)]">
                                                        <AlertCircle className="w-12 h-12 text-white" />
                                                    </div>
                                                    <h2 className="text-3xl font-black mt-2">Invalid Ticket</h2>
                                                    <p className="text-lg font-medium opacity-80">{scanResult?.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isScanning && !isProcessing && (
                                        <button
                                            onClick={resetScanner}
                                            className="mt-8 px-10 py-4 bg-indigo-600 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                                        >
                                            <ScanLine className="w-5 h-5" />
                                            Scan Next Ticket
                                        </button>
                                    )}
                                </div>

                                {/* Footer Tips */}
                                <div className="p-8 bg-gray-950/50">
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-indigo-400 shrink-0">
                                                <Camera className="w-4 h-4" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-tight">Center the QR code in the frame to scan.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-amber-400 shrink-0">
                                                <AlertCircle className="w-4 h-4" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-tight">Ensure the attendee has maximum screen brightness.</p>
                                        </div>
                                    </div>
                                </div>

                                <style jsx global>{`
                  @keyframes scan-move {
                    0%, 100% { transform: translate(-50%, -120px); }
                    50% { transform: translate(-50%, 120px); }
                  }
                  .animate-scan-move {
                    animation: scan-move 2.5s infinite ease-in-out;
                  }
                `}</style>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
