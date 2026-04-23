import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shopping Cart — DearPast',
  description: 'Review your custom printed products and proceed to checkout. Volume pricing automatically applied.',
  openGraph: {
    title: 'Shopping Cart — DearPast',
    description: 'Review your custom printed products and proceed to checkout.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/cart`,
    siteName: 'DearPast',
    images: ['/icons/icon-192x192.png'],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Shopping Cart — DearPast',
    description: 'Review your custom printed products and proceed to checkout.',
    images: ['/icons/icon-192x192.png']
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/cart`
  }
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}