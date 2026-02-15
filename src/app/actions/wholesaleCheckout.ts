'use server';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { app as firebaseApp } from '@/lib/firebase';
import {
  WholesaleOrder,
  WholesaleOrderItem,
} from '@/types/wholesale';
import { StoreMeta } from '@/types/store';
import { Product } from '@/types/product';

const db = getFirestore(firebaseApp);

interface CartItem {
  productId: string;
  quantity: number;
}

/**
 * Validate wholesale order and create it
 * Returns Paystack authorization URL and order details
 */
export async function createWholesaleOrder(
  buyerStoreId: string,
  sellerStoreId: string,
  items: CartItem[],
  paymentTermsDays: 0 | 7 | 14 | 30,
  notes?: string
) {
  try {
    // Validate payment terms
    if (![0, 7, 14, 30].includes(paymentTermsDays)) {
      return {
        success: false,
        error: 'Invalid payment terms. Must be 0, 7, 14, or 30 days.',
      };
    }

    // Get both stores
    const [buyerSnap, sellerSnap] = await Promise.all([
      getDoc(doc(db, 'stores', buyerStoreId)),
      getDoc(doc(db, 'stores', sellerStoreId)),
    ]);

    if (!buyerSnap.exists() || !sellerSnap.exists()) {
      return { success: false, error: 'One or both stores not found' };
    }

    const buyerStore = buyerSnap.data() as StoreMeta;
    const sellerStore = sellerSnap.data() as StoreMeta;

    // Verify partnership exists and is active
    const partnerSnap = await getDoc(
      doc(db, 'stores', buyerStoreId, 'wholesalePartners', sellerStoreId)
    );

    if (!partnerSnap.exists()) {
      return { success: false, error: 'Partnership not established with this store' };
    }

    const partner = partnerSnap.data();
    if (partner.status !== 'active') {
      return { success: false, error: 'Partnership is not active' };
    }

    // Process order items
    let subtotal = 0;
    const orderItems: WholesaleOrderItem[] = [];

    for (const cartItem of items) {
      const productRef = doc(
        db,
        'stores',
        sellerStoreId,
        'products',
        cartItem.productId
      );
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return { success: false, error: `Product ${cartItem.productId} not found` };
      }

      const product = productSnap.data() as Product;

      // Validate: product available for wholesale
      if (!product.isAvailableForWholesale) {
        return {
          success: false,
          error: `${product.name} is not available for wholesale`,
        };
      }

      // Validate: minimum quantity
      const minQty = product.minOrderQuantity || 1;
      if (cartItem.quantity < minQty) {
        return {
          success: false,
          error: `${product.name} requires minimum order of ${minQty} units`,
        };
      }

      // Calculate discount
      let discount = sellerStore.wholesaleConfig?.globalDiscount || 0;

      // Check for tier pricing
      if (product.wholesalePricing?.tierPricing) {
        for (const tier of product.wholesalePricing.tierPricing) {
          if (cartItem.quantity >= tier.minQty) {
            discount = tier.discount;
          }
        }
      }

      // Check for custom partner discount
      if (product.wholesalePricing?.customPartnerDiscounts?.[buyerStoreId]) {
        discount = product.wholesalePricing.customPartnerDiscounts[buyerStoreId];
      }

      // Calculate line total
      const unitPrice = product.price;
      const discountAmount = (unitPrice * discount) / 100;
      const priceAfterDiscount = unitPrice - discountAmount;
      const lineTotal = priceAfterDiscount * cartItem.quantity;

      subtotal += lineTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        unitPrice,
        discount,
        lineTotal,
      });
    }

    // Validate minimum order value
    const minOrderValue = sellerStore.wholesaleConfig?.minOrderValue || 0;
    if (subtotal < minOrderValue) {
      return {
        success: false,
        error: `Minimum order value is ₦${minOrderValue.toLocaleString()}. Your order is ₦${subtotal.toLocaleString()}`,
      };
    }

    // Calculate fees
    const platformFee = subtotal * 0.05; // 5% platform fee
    const total = subtotal + platformFee;

    // Create order
    const orderId = `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const wholesaleOrder: WholesaleOrder = {
      id: orderId,
      buyerStoreId,
      sellerStoreId,
      items: orderItems,
      status: 'pending',
      paymentStatus: 'pending',
      subtotal,
      platformFee,
      total,
      paymentTermsDays,
      createdAt: Timestamp.now(),
      notes,
    };

    // Save order to database
    const batch = writeBatch(db);

    batch.set(
      doc(db, 'stores', buyerStoreId, 'wholesaleOrders', orderId),
      wholesaleOrder
    );

    // Also save to seller's store for visibility
    batch.set(
      doc(db, 'stores', sellerStoreId, 'wholesaleOrders', orderId),
      wholesaleOrder
    );

    await batch.commit();

    // Return order details and payment info
    // In real implementation, would initialize Paystack here
    return {
      success: true,
      orderId,
      orderDetails: {
        subtotal,
        platformFee,
        total,
        items: orderItems,
        paymentTermsDays,
      },
      message: 'Order created successfully. Proceed to payment.',
    };
  } catch (error) {
    console.error('Error creating wholesale order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

/**
 * Initialize Paystack checkout for a wholesale order
 * Called after order is created and buyer proceeds to payment
 */
export async function initializeWholesalePayment(
  orderId: string,
  buyerStoreId: string,
  paystackCustomerCode: string
) {
  try {
    const orderRef = doc(db, 'stores', buyerStoreId, 'wholesaleOrders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }

    const order = orderSnap.data() as WholesaleOrder;

    // Prepare Paystack initialization
    const paystackData = {
      email: '', // Will be fetched from store
      amount: Math.round(order.total * 100), // Convert to kobo
      metadata: {
        orderId: orderId,
        buyerStoreId: buyerStoreId,
        sellerStoreId: order.sellerStoreId,
        wholesaleOrderId: orderId, // For webhook detection
        orderType: 'wholesale',
        paymentTermsDays: order.paymentTermsDays,
      },
      channels: ['card', 'bank_transfer'],
    };

    // In actual implementation:
    // 1. Fetch buyer store email
    // 2. Initialize Paystack transaction
    // 3. Return authorization URL

    return {
      success: true,
      orderId,
      amount: order.total,
      message: 'Ready for payment. Redirect to Paystack checkout.',
    };
  } catch (error) {
    console.error('Error initializing payment:', error);
    return { success: false, error: 'Failed to initialize payment' };
  }
}

/**
 * Mark a wholesale order as shipped (seller action)
 */
export async function shipWholesaleOrder(
  orderId: string,
  sellerStoreId: string
) {
  try {
    // Verify order exists and seller is correct
    const orderRef = doc(db, 'stores', sellerStoreId, 'wholesaleOrders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }

    const order = orderSnap.data() as WholesaleOrder;

    if (order.status !== 'paid') {
      return { success: false, error: 'Order must be paid before shipping' };
    }

    const batch = writeBatch(db);

    const updateData = {
      status: 'shipped' as const,
      shippedAt: Timestamp.now(),
    };

    batch.update(
      doc(db, 'stores', sellerStoreId, 'wholesaleOrders', orderId),
      updateData
    );

    batch.update(
      doc(db, 'stores', order.buyerStoreId, 'wholesaleOrders', orderId),
      updateData
    );

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error shipping order:', error);
    return { success: false, error: 'Failed to ship order' };
  }
}

/**
 * Confirm delivery of a wholesale order (buyer action)
 */
export async function confirmWholesaleOrderDelivery(
  orderId: string,
  buyerStoreId: string
) {
  try {
    const orderRef = doc(db, 'stores', buyerStoreId, 'wholesaleOrders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }

    const order = orderSnap.data() as WholesaleOrder;

    if (order.status !== 'shipped') {
      return { success: false, error: 'Order must be shipped before confirming delivery' };
    }

    const batch = writeBatch(db);

    const updateData = {
      status: 'delivered' as const,
      deliveredAt: Timestamp.now(),
    };

    batch.update(
      doc(db, 'stores', buyerStoreId, 'wholesaleOrders', orderId),
      updateData
    );

    batch.update(
      doc(db, 'stores', order.sellerStoreId, 'wholesaleOrders', orderId),
      updateData
    );

    // Update partner stats (total orders, revenue)
    batch.update(
      doc(db, 'stores', order.sellerStoreId, 'wholesalePartners', buyerStoreId),
      {
        totalOrders: increment(1),
        totalRevenue: increment(order.subtotal),
        lastOrderDate: Timestamp.now(),
      }
    );

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return { success: false, error: 'Failed to confirm delivery' };
  }
}

/**
 * Get wholesale orders for a store
 */
export async function getWholesaleOrders(
  storeId: string,
  role: 'buyer' | 'seller' | 'all' = 'all'
) {
  try {
    const ordersSnap = await getDocs(
      collection(db, 'stores', storeId, 'wholesaleOrders')
    );

    let orders = ordersSnap.docs.map((doc) => doc.data() as WholesaleOrder);

    // Filter by role if specified
    if (role === 'buyer') {
      orders = orders.filter((o) => o.buyerStoreId === storeId);
    } else if (role === 'seller') {
      orders = orders.filter((o) => o.sellerStoreId === storeId);
    }

    return { success: true, orders };
  } catch (error) {
    console.error('Error getting orders:', error);
    return { success: false, error: 'Failed to fetch orders' };
  }
}
