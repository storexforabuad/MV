import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { CartProvider } from '../lib/cartContext'
import { ThemeProvider } from '../lib/themeContext'
import Navbar from '../components/layout/navbar'
import ClientProviders from '../components/ClientProviders'
import { CustomerProvider } from '@/context/CustomerContext'
import ReferralHandlerWrapper from '@/components/ReferralHandlerWrapper'
import { getStoreMeta } from '@/lib/db'
import Script from 'next/script'
import ProtectionProvider from '@/components/ProtectionProvider'
import GlobalAnnouncement from '@/components/common/GlobalAnnouncement'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export async function generateMetadata({ params }: { params: { storeId: string } }): Promise<Metadata> {
  if (params.storeId) {
    const store = await getStoreMeta(params.storeId);

    if (store) {
      return {
        title: store.name,
        description: store.description || "Discover Amazing Products",
        manifest: '/manifest.json',
        appleWebApp: {
          capable: true,
          statusBarStyle: "black-translucent",
          title: store.name,
        },
        formatDetection: {
          telephone: false,
        },
      };
    }
  }

  // Default metadata if no storeId or store not found
  return {
    title: "BizconNet™",
    description: "Discover Authentic Products At Affordable Prices",
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "BizconNet™",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <ThemeProvider>
          <CustomerProvider>
            <CartProvider>
              <ClientProviders>
                <ProtectionProvider>
                  <ReferralHandlerWrapper />
                  <GlobalAnnouncement />
                  <Navbar />
                  {children}
                </ProtectionProvider>
                <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
              </ClientProviders>
            </CartProvider>
          </CustomerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}