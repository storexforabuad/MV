export function stripUndefined(input: any): any {
  if (input === undefined) return undefined;
  if (input === null) return null;
  if (Array.isArray(input)) {
    return input.map((v) => v === undefined ? null : stripUndefined(v));
  }
  if (typeof input === 'object') {
    // Preserve Date and other non-plain objects
    if (input instanceof Date) return input;
    const out: any = {};
    for (const key of Object.keys(input)) {
      const val = input[key];
      if (val === undefined) continue; // drop undefined
      const cleaned = stripUndefined(val);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return input;
}

export default stripUndefined;
