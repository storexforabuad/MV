'use client';

import { CheckCircleIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Naira } from './Naira';

// This is a placeholder for the actual order type, I'll need to find the correct type definition
type Order = any;

const GuaranteeIcon = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
    <div className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="w-5 h-5 text-gray-400" />
        <span>{text}</span>
    </div>
);

export function Receipt({ order }: { order: Order }) {
    if (!order) return null;

    const items = order.items || (order.product ? [{ ...order.product, quantity: order.quantity || 1 }] : []);
    const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
    const shipping = order.shipping || 0;
    const total = subtotal + shipping;
    const orderDate = order.orderDate || order.createdAt;

    return (
        <div className="bg-white rounded-2xl shadow-lg max-w-sm mx-auto font-sans relative overflow-hidden">
            <div className="p-6 pb-2 relative">
                <div className="absolute top-0 left-0 w-full h-24 bg-gray-50/50 backdrop-blur-xl" style={{
                    clipPath: 'ellipse(100% 55% at 48% 44%)'
                }}></div>
                <div className="relative z-10 text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Order Receipt</h2>
                    <p className="text-sm text-gray-500">{new Date(orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="space-y-3 text-sm">
                    {items.map((item: any, index: number) => (
                        <div key={item.id || index} className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">{item.name}</p>
                                <p className="text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-gray-800 font-medium">
                                <Naira amount={item.price * item.quantity} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 pt-2">
                <div className="border-t border-dashed border-gray-300 my-4"></div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-800 font-medium"><Naira amount={subtotal} /></span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-800 font-medium"><Naira amount={shipping} /></span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                        <span className="text-gray-800">Total</span>
                        <span className="text-gray-900"><Naira amount={total} /></span>
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-4"></div>

                <div className="grid grid-cols-3 gap-2 text-center py-2">
                    <GuaranteeIcon icon={ShieldCheckIcon} text="Secure Transaction" />
                    <GuaranteeIcon icon={CheckCircleIcon} text="Quality Assured" />
                    <GuaranteeIcon icon={TruckIcon} text="Fast Delivery" />
                </div>
            </div>

            <div className="bg-gray-50 text-center py-3 px-6 rounded-b-2xl relative z-10">
                <p className="text-xs text-gray-500 font-medium">Powered by BizCon™ Network</p>
            </div>
             <div className="absolute bottom-0 left-0 w-full h-16 bg-gray-50/50 backdrop-blur-xl" style={{
                    clipPath: 'ellipse(100% 55% at 48% 100%)'
                }}></div>
        </div>
    );
}
