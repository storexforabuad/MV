/**
 * Utility functions for phone number formatting and validation.
 */

/**
 * Formats a phone number for use in WhatsApp wa.me links.
 * - Removes all non-digit characters.
 * - Handles Nigerian numbers starting with '0' by replacing it with '234'.
 * - Ensures the number has a country code (defaults to 234 if it looks like a Nigerian number).
 * 
 * @param phone - The raw phone number string
 * @returns A formatted string containing only digits, suitable for WhatsApp
 */
export function formatWhatsAppNumber(phone: string | undefined): string {
    if (!phone) return '';

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with '0' and is 11 digits long, it's likely a Nigerian local number
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        return '234' + cleaned.substring(1);
    }

    // If it's 10 digits and doesn't start with 0, it might be missing the country code
    if (cleaned.length === 10 && !cleaned.startsWith('0')) {
        return '234' + cleaned;
    }

    // If it already starts with 234, return as is
    if (cleaned.startsWith('234')) {
        return cleaned;
    }

    // Return cleaned digits as fallback
    return cleaned;
}
