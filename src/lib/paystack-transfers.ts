/**
 * Paystack Transfers API Integration
 * Used for vendor payout/settlement after wholesale orders
 */

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error(
    'PAYSTACK_SECRET_KEY environment variable is not set'
  );
}

/**
 * Transfer funds to a vendor's Paystack subaccount
 * @param recipientSubaccountCode - The subaccount code to transfer to
 * @param amountInKobo - Amount in kobo (divide ₦ by 100)
 * @param reference - Unique reference for the transfer (e.g., "INV-001234")
 * @param reason - Reason for transfer (e.g., "Wholesale order settlement")
 */
export async function transferToVendorSubaccount(
  recipientSubaccountCode: string,
  amountInKobo: number,
  reference: string,
  reason: string
): Promise<{
  success: boolean;
  transferId?: string;
  error?: string;
}> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(`${PAYSTACK_API_URL}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance', // Transfer from platform balance
        recipient: recipientSubaccountCode,
        amount: amountInKobo,
        reference: reference,
        reason: reason,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack transfer error:', data);
      return {
        success: false,
        error: data.message || 'Failed to process transfer',
      };
    }

    return {
      success: true,
      transferId: data.data?.transfer_code || data.data?.id,
    };
  } catch (error) {
    console.error('Error transferring funds:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Verify a transfer status
 * @param transferCode - The transfer code from Paystack
 */
export async function verifyTransfer(transferCode: string): Promise<{
  success: boolean;
  status?: string;
  amount?: number;
  error?: string;
}> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(`${PAYSTACK_API_URL}/transfer/verify/${transferCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to verify transfer',
      };
    }

    return {
      success: true,
      status: data.data?.status,
      amount: data.data?.amount,
    };
  } catch (error) {
    console.error('Error verifying transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get transfer recipient details
 * @param recipientCode - The recipient code
 */
export async function getTransferRecipient(recipientCode: string): Promise<{
  success: boolean;
  name?: string;
  error?: string;
}> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await fetch(`${PAYSTACK_API_URL}/transfer_recipient/${recipientCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to fetch recipient details',
      };
    }

    return {
      success: true,
      name: data.data?.name,
    };
  } catch (error) {
    console.error('Error fetching transfer recipient:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
