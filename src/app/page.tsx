import Link from 'next/link'
import Image from 'next/image'
import { ChevronRightIcon, SparklesIcon, TruckIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const categories = [
    {
      name: 'T-Shirts',
      href: '/products/t-shirts',
      icon: '👕',
      image: '/images/products/category-tshirts.jpg',
      description: 'Custom printed t-shirts in all sizes'
    },
    {
      name: 'Blankets',
      href: '/products/blankets',
      icon: '🏠',
      image: '/images/products/category-blankets.jpg',
      description: 'Cozy custom blankets and throws'
    },
    {
      name: 'Flags',
      href: '/products/flags',
      icon: '🏴',
      image: '/images/products/category-flags.jpg',
      description: 'Custom flags for any occasion'
    },
    {
      name: 'Banners',
      href: '/products/banners',
      icon: '📋',
      image: '/images/products/category-banners.jpg',
      description: 'Vinyl banners and signs'
    }
  ]

  const features = [
    {
      icon: SparklesIcon,
      title: 'No Minimums',
      description: 'Order as few as 1 item or as many as you need'
    },
    {
      icon: TruckIcon,
      title: 'Quality Materials',
      description: 'Premium materials and professional printing'
    },
    {
      icon: ClockIcon,
      title: '2-3 Week Delivery',
      description: 'Fast turnaround for custom printed items'
    }
  ]

  const steps = [
    {
      step: '01',
      title: 'Choose Your Product',
      description: 'Select from t-shirts, blankets, flags, or banners',
      color: 'text-accent-lime-500'
    },
    {
      step: '02', 
      title: 'Upload Your Design',
      description: 'Add your own image, text, or choose from our catalog',
      color: 'text-accent-coral-500'
    },
    {
      step: '03',
      title: 'We Print & Ship',
      description: 'Professional printing and fast shipping to your door',
      color: 'text-accent-lime-500'
    }
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        {/* Background hero image */}
        <div className="absolute inset-0">
          <Image
            src="/images/products/hero-banner.jpg"
            alt="Custom printed products"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="mb-6">
              <span className="font-script text-5xl md:text-7xl tracking-wide" style={{ color: '#C0C0C0' }}>DearPast</span>
              <br />
              <span className="font-display font-bold text-2xl md:text-4xl mt-2 block">
                Custom Products, <span className="text-gradient">Made Your Way</span>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary-200 mb-8">
              Upload your design, choose your product, and we'll handle the rest.<br />
              Quality custom printing with no minimums.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="btn-primary text-lg px-8 py-4">
                Start Creating
                <ChevronRightIcon className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link href="/about" className="btn-outline text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-600">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="section-padding bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-primary-600 mb-4">
              Choose Your Canvas
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              From wearables to home decor, we print on the products you love
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="card overflow-hidden text-center hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-xl text-primary-600 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-secondary-600 text-sm">{category.description}</p>
                  <div className="mt-3 text-accent-coral-500 font-semibold group-hover:text-accent-lime-500 transition-colors duration-300 text-sm">
                    Explore Collection →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding bg-background-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-primary-600 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Getting your custom products is easier than ever
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="text-center relative">
                <div className={`font-display font-bold text-6xl ${step.color} mb-4`}>
                  {step.step}
                </div>
                <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
                  {step.title}
                </h3>
                <p className="text-secondary-600">{step.description}</p>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-accent-lime-300 to-accent-coral-300 transform -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-primary-600 mb-4">
              Why Choose DearPast?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 text-white">
        <div className="container mx-auto text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of happy customers who trust us with their custom printing needs
          </p>
          <Link href="/products" className="bg-white text-accent-coral-500 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-flex items-center">
            Browse Products
            <ChevronRightIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </>
  )
}