import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { CartProvider } from '../lib/cartContext'
import { ThemeProvider } from '../lib/themeContext'
import Navbar from '../components/layout/navbar'
import ClientProviders from '../components/ClientProviders'
import { CustomerProvider } from '@/context/CustomerContext'
import ReferralHandler from '@/components/ReferralHandler'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Alaniq INT.",
  description: "Discover Beautiful RTW, Perfumes, Incense & More",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alaniq INT.",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
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
                <ReferralHandler />
                <Navbar />
                {children}
              </ClientProviders>
            </CartProvider>
          </CustomerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}