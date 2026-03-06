'use client';

import { CheckCircleIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Naira } from './Naira';

// Define a type for the items within an order
export interface ReceiptItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    selectedSize?: string;
}

// Define a flexible Order type to accommodate different data structures
export interface Order {
    id?: string | number;
    createdAt?: string | number | Date;
    orderDate?: string | number | Date;
    items?: ReceiptItem[];
    products?: ReceiptItem[]; // Support products array from StoreOrder
    product?: {
        id: string | number;
        name: string;
        price: number;
    };
    quantity?: number;
    shipping?: number;
}

const GuaranteeIcon = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
    <div className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="w-5 h-5 text-gray-400" />
        <span>{text}</span>
    </div>
);

export function Receipt({ orders }: { orders: Order[] }) {
    if (!orders || orders.length === 0) return null;

    // Normalize the orders to extract items/products
    const allItems = orders.flatMap(order => {
        // Priority: products > items > product
        if (order.products && Array.isArray(order.products)) {
            return order.products.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                quantity: p.quantity || 1,
                selectedSize: (p as any).selectedSize
            }));
        }
        if (order.items && Array.isArray(order.items)) {
            return order.items;
        }
        if (order.product) {
            return [{
                id: order.product.id,
                name: order.product.name,
                price: order.product.price,
                quantity: order.quantity || 1
            }];
        }
        return [];
    });

    const subtotal = allItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = orders.reduce((acc, order) => acc + (order.shipping || 0), 0); // Sum up shipping costs if they vary per order
    const total = subtotal + shipping;
    const orderDate = orders[0].orderDate || orders[0].createdAt;

    return (
        <div className="bg-white rounded-2xl shadow-lg max-w-sm mx-auto font-sans relative overflow-hidden">
            <div className="p-6 pb-2 relative">
                <div className="absolute top-0 left-0 w-full h-24 bg-gray-50/50 backdrop-blur-xl" style={{
                    clipPath: 'ellipse(100% 55% at 48% 44%)'
                }}></div>
                <div className="relative z-10 text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Order Receipt</h2>
                    {orderDate && (
                        <p className="text-sm text-gray-500">{new Date(orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    )}
                </div>

                <div className="space-y-3 text-sm max-h-60 overflow-y-auto pr-2">
                    {allItems.map((item, index) => (
                        <div key={item.id ? `${item.id}-${index}` : index} className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800">{item.name}</p>
                                {item.selectedSize && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                        Size: {item.selectedSize}
                                    </span>
                                )}
                                <p className="text-gray-500 mt-0.5">Qty: {item.quantity}</p>
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
                <p className="text-xs text-gray-500 font-medium">Powered by <span className="font-bold text-indigo-600">BizconNet™</span> Network</p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gray-50/50 backdrop-blur-xl" style={{
                clipPath: 'ellipse(100% 55% at 48% 100%)'
            }}></div>
        </div>
    );
}
