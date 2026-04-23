'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NewsletterSignup from '@/components/NewsletterSignup'

export default function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  // Hide footer on admin pages
  if (pathname?.startsWith('/admin')) return null

  const productLinks = [
    { name: 'T-Shirts', href: '/products/t-shirts' },
    { name: 'Blankets', href: '/products/blankets' },
    { name: 'Banners', href: '/products/banners' },
    { name: 'Flags', href: '/products/flags' },
  ]

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'How It Works', href: '/#how-it-works' },
  ]

  const legalLinks = [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Return Policy', href: '/returns' },
  ]

  return (
    <footer className="bg-neutral-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <span className="font-script text-2xl tracking-wide" style={{ color: '#C0C0C0' }}>
                DearPast
              </span>
            </div>
            <p className="text-secondary-400 mb-4">
              Custom printed products made simple. Upload your design, choose your product, and we'll handle the rest.
            </p>
            <div className="text-secondary-400 text-sm space-y-1">
              <p>DearPast</p>
              <p>2307 Willow Lakes East Blvd</p>
              <p>Greenwood, Indiana 46143</p>
              <p><a href="tel:+13179975503" className="hover:text-accent-lime-500 transition-colors duration-200">(317) 997-5503</a></p>
              <p>info@crystalharbortc.com</p>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Products</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-secondary-400 hover:text-accent-lime-500 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-secondary-400 hover:text-accent-coral-500 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-secondary-400 hover:text-accent-lime-500 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Business Hours</h4>
              <p className="text-secondary-400 text-sm">
                Monday - Friday<br />
                9 AM - 5 PM EST
              </p>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="md:col-span-2 lg:col-span-1">
            <NewsletterSignup source="footer" />
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-neutral-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-secondary-400 text-sm mb-4 md:mb-0">
              © {currentYear} DearPast. All rights reserved.
            </div>
            <div className="text-secondary-400 text-sm">
              Quality custom printing with no minimums • 2-3 weeks fulfillment
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}