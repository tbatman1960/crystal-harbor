import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout — Crystal Harbor Trading Company',
  description: 'Complete your order for custom printed products. Secure payment processing with Stripe.',
  openGraph: {
    title: 'Checkout — Crystal Harbor Trading Company',
    description: 'Complete your order for custom printed products. Secure payment processing.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'}/checkout`,
    siteName: 'Crystal Harbor Trading Company',
    images: ['/icons/icon-192x192.png'],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Checkout — Crystal Harbor Trading Company',
    description: 'Complete your order for custom printed products.',
    images: ['/icons/icon-192x192.png']
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'}/checkout`
  }
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}