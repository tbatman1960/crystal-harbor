import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PWAProvider from '@/components/PWAProvider'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import EmailCapturePopup from '@/components/EmailCapturePopup'
import { generateOrganizationStructuredData } from '@/lib/seo'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Crystal Harbor Trading Co. — Custom Printed T-Shirts, Blankets, Banners & Flags',
  description: 'Upload your design, choose your product, and we\'ll handle the rest. Quality custom printing with no minimums. Volume pricing available.',
  keywords: 'custom printing, t-shirts, banners, flags, blankets, personalized products, volume pricing, no minimum orders',
  authors: [{ name: 'Crystal Harbor Trading Company' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Crystal Harbor Trading Co. — Custom Printed Products',
    description: 'Quality custom printing with no minimums. Upload your design and create something unique.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com',
    siteName: 'Crystal Harbor Trading Company',
    images: [
      {
        url: '/icons/icon-192x192.png',
        width: 192,
        height: 192,
        alt: 'Crystal Harbor Trading Company Logo'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crystal Harbor Trading Co. — Custom Printed Products',
    description: 'Quality custom printing with no minimums. Upload your design and create something unique.',
    images: ['/icons/icon-192x192.png']
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Crystal Harbor'
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1E3A8A'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationData = generateOrganizationStructuredData()
  
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen flex flex-col">
        <GoogleAnalytics />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <PWAProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <EmailCapturePopup delaySeconds={30} enableExitIntent={true} />
        </PWAProvider>
      </body>
    </html>
  )
}