export function sendEvent(name: string, payload: any = {}) {
  try {
    // Replace this with real analytics integration as needed
    console.log('[analytics]', name, payload);
  } catch (e) {
    // noop
  }
}
