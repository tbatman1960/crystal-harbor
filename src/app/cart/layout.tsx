import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shopping Cart — Crystal Harbor Trading Company',
  description: 'Review your custom printed products and proceed to checkout. Volume pricing automatically applied.',
  openGraph: {
    title: 'Shopping Cart — Crystal Harbor Trading Company',
    description: 'Review your custom printed products and proceed to checkout.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'}/cart`,
    siteName: 'Crystal Harbor Trading Company',
    images: ['/icons/icon-192x192.png'],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Shopping Cart — Crystal Harbor Trading Company',
    description: 'Review your custom printed products and proceed to checkout.',
    images: ['/icons/icon-192x192.png']
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'}/cart`
  }
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}