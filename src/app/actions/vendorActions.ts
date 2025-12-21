import { getStoreMeta } from '@/lib/db';

function normalizePhone(input: string) {
  if (!input) return '';
  let s = input.replace(/\D/g, '');
  if (s.length === 11 && s.startsWith('0')) {
    s = '234' + s.substring(1);
  }
  return s;
}

export async function verifyVendorByPhone(storeId: string, phone: string) {
  try {
    const store = await getStoreMeta(storeId);
    if (!store) return { success: false, reason: 'store_not_found' };

    const normalizedInput = normalizePhone(phone);
    const normalizedStore = normalizePhone(store.whatsapp || '');

    const idMatches = !store.id || String(store.id).trim().toLowerCase() === String(storeId).trim().toLowerCase();
    if (normalizedInput && normalizedStore && normalizedInput === normalizedStore && idMatches) {
      return { success: true, vendor: { phone: store.whatsapp || phone, storeId: storeId, name: store.name, id: store.id } };
    }
    return { success: false, reason: 'not_found' };
  } catch (err) {
    console.error('verifyVendorByPhone error', err);
    return { success: false, reason: 'error' };
  }
}
