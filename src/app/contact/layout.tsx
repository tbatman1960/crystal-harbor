import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us — DearPast',
  description: 'Get in touch with DearPast. We\'re here to help with your custom printing needs and answer any questions.',
  keywords: 'contact crystal harbor, customer support, custom printing help, get in touch',
  openGraph: {
    title: 'Contact DearPast',
    description: 'Get in touch with us for custom printing help and support. We\'re here to answer your questions.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/contact`,
    siteName: 'DearPast',
    images: ['/icons/icon-192x192.png'],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Contact DearPast',
    description: 'Get in touch with us for custom printing help and support.',
    images: ['/icons/icon-192x192.png']
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/contact`
  }
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}