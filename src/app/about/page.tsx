import { Metadata } from 'next'
import { generateBreadcrumbStructuredData } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About Us — Crystal Harbor Trading Company',
  description: 'Learn about Crystal Harbor Trading Company - your trusted partner for custom printed products. Quality, affordability, and personal service with no minimums.',
  keywords: 'about crystal harbor, custom printing company, personalized products, quality printing, no minimum orders',
  openGraph: {
    title: 'About Crystal Harbor Trading Company',
    description: 'Your trusted partner for custom printed products with quality, affordability, and personal service.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/about`,
    siteName: 'Crystal Harbor Trading Company',
    images: ['/icons/icon-192x192.png'],
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'About Crystal Harbor Trading Company',
    description: 'Your trusted partner for custom printed products with quality, affordability, and personal service.',
    images: ['/icons/icon-192x192.png']
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/about`
  }
}

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' }
  ]
  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  return (
    <>
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <div className="section-padding bg-white">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-600 mb-6">
            About Crystal Harbor
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Where style meets affordability and every product tells a story
          </p>
        </div>

        {/* Main Story */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-lg text-secondary-700 leading-relaxed mb-6">
            Welcome to Crystal Harbor Trading Company, where style meets affordability and every product tells a story. Our journey began with a simple idea: families deserve quality, beautiful products without the heavy price tag.
          </p>
          
          <p className="text-lg text-secondary-700 leading-relaxed mb-6">
            Inspired by the clarity and calm of a harbor at sunrise, our founders—one with roots in America and the other in China—set out to build a trading bridge between two cultures, delivering curated finds that combine craftsmanship, function, and a touch of everyday elegance.
          </p>
          
          <p className="text-lg text-secondary-700 leading-relaxed mb-8">
            We believe that shopping should be personal and worry-free. That's why each order is carefully reviewed and tailored to your preferences—whether you're choosing the perfect custom t-shirt for your team or selecting a personalized blanket to brighten your day. We handle every request with the care and attention you'd expect from a family-owned boutique.
          </p>
        </div>

        {/* Values Section */}
        <div className="bg-background-50 rounded-2xl p-8 mb-12">
          <h2 className="font-display font-bold text-2xl text-primary-600 mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-lime-600 text-2xl">✨</span>
              </div>
              <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
                Clarity
              </h3>
              <p className="text-secondary-600">
                In pricing and communication - no hidden fees, no surprises
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-coral-600 text-2xl">🤝</span>
              </div>
              <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
                Reliability
              </h3>
              <p className="text-secondary-600">
                In sourcing and delivery - we keep our promises
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-2xl">⚖️</span>
              </div>
              <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
                Harmony
              </h3>
              <p className="text-secondary-600">
                In the blend of East and West influences
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-secondary-600 text-2xl">🏠</span>
              </div>
              <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
                Welcome
              </h3>
              <p className="text-secondary-600">
                A welcoming spirit—just like a safe harbor
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-12">
          <h2 className="font-display font-bold text-2xl text-primary-600 mb-8 text-center">
            Why Choose Crystal Harbor?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl">🎨</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-primary-600 mb-2">
                Custom Everything
              </h3>
              <p className="text-secondary-600">
                Upload your designs, add custom text, or browse our catalog. Make it uniquely yours.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl">⭐</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-primary-600 mb-2">
                Quality Materials
              </h3>
              <p className="text-secondary-600">
                Professional printing on premium materials. Every product is made to last.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl">💝</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-primary-600 mb-2">
                Personal Service
              </h3>
              <p className="text-secondary-600">
                Every order is reviewed by hand. We're here to help make your vision a reality.
              </p>
            </div>
          </div>
        </div>

        {/* Closing */}
        <div className="text-center bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 text-white rounded-2xl p-8">
          <h2 className="font-display font-bold text-2xl mb-4">
            Ready to Create Something Special?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Thank you for letting us be a small part of your everyday moments. We look forward to serving you, one thoughtful order at a time.
          </p>
          <p className="font-display font-semibold text-xl">
            Crystal Harbor Trading Company<br />
            <span className="text-lg opacity-90">Inspired by the sea. Crafted for your life.</span>
          </p>
        </div>
        </div>
      </div>
    </>
  )
}