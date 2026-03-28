import { Order } from '@/hooks/useOrders';
import { formatPrice } from './price';
import { formatWhatsAppNumber } from './phoneUtils';

/**
 * Generates a formatted WhatsApp message for an order receipt.
 */
export const generateOrderReceiptMessage = (order: Order, trxref?: string): string => {
    const storeName = order.storeMeta?.name || 'the store';
    const orderId = order.id.slice(0, 8).toUpperCase();
    const reference = trxref || order.paymentEvidenceFileName || 'N/A'; // Use reference or trxref

    let productDetails = '';
    if (order.products && order.products.length > 0) {
        productDetails = order.products.map((p: any) => {
            // Create a fallback URL or use the product page if available
            return `• *${p.name.trim()}* (x${p.quantity || 1})`;
        }).join('\n');
    }

    const totalAmount = order.products.reduce((sum: number, p: any) => sum + (p.price * (p.quantity || 1)), 0);

    let deliveryDetails = '';
    if (order.deliveryMethod === 'pickup') {
        deliveryDetails = `🏪 *Delivery:* Pickup at Store`;
    } else {
        const addr = order.customerInfo?.deliveryAddress;
        if (addr) {
            deliveryDetails = `📍 *Delivery Address:*\n${addr.street}, ${addr.state}`;
        }
    }

    return `✅ *Order Receipt - ${storeName}*\n\n` +
        `Hello! I'm sharing my order receipt.\n\n` +
        `💳 *Reference:* ${reference}\n` +
        `🆔 *Order ID:* #${orderId}\n\n` +
        `📦 *Order Details:*\n${productDetails}\n\n` +
        (deliveryDetails ? `${deliveryDetails}\n\n` : '') +
        `💰 *Total:* ${formatPrice(totalAmount)}\n\n` +
        `*Escrow Status:* Supported by BizCon Escrow. Funds are protected until delivery. ✨`;
};

/**
 * Opens WhatsApp with the generated receipt message.
 */
export const handleSendWhatsAppReceipt = (order: Order, trxref?: string) => {
    const message = generateOrderReceiptMessage(order, trxref);
    const whatsapp = order.storeMeta?.whatsapp;

    const whatsappUrl = whatsapp
        ? `https://wa.me/${formatWhatsAppNumber(whatsapp)}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
};
