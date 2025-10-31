import { getStoreMeta } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Prevent caching of this dynamic route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const storeId = searchParams.get('storeId');
  const context = searchParams.get('context'); // 'customer' or 'admin'

  if (!storeId || !context) {
    return new NextResponse('Missing storeId or context', { status: 400 });
  }

  const meta = await getStoreMeta(storeId);
  const storeName = meta?.name || storeId; // Fallback to storeId if name not found

  let manifest: Record<string, unknown> = {
    background_color: '#0f172a', // slate-900
    dir: 'ltr',
    display: 'standalone',
    lang: 'en',
    theme_color: '#0f172a', // slate-900
    icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-256x256.png',
          sizes: '256x256',
          type: 'image/png',
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ]
  };

  if (context === 'customer') {
    manifest = {
      ...manifest,
      name: `${storeName}`,
      short_name: `${storeName}`,
      start_url: `/${storeId}`,
      scope: `/${storeId}`,
    };
  } else if (context === 'admin') {
    manifest = {
      ...manifest,
      name: `Admin: ${storeName}`,
      short_name: `Admin: ${storeName}`,
      start_url: `/admin/${storeId}`,
      scope: `/admin/${storeId}`,
    };
  }

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
