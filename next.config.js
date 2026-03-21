/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Netlify deployment
  trailingSlash: false,
  
  // Image optimization (Netlify handles this with Next.js plugin)
  images: {
    domains: [
      'localhost',
      'crystalharbor.netlify.app',
      'bdcqyconjwevyzjlubce.supabase.co' // Supabase storage domain
    ],
  },
  
  // Environment variables are handled automatically by Next.js
  
  // Webpack configuration for better bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize for production builds
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
      }
    }
    
    return config
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://crystalharbor.netlify.app' 
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      // Add any permanent redirects here
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // Experimental features for better performance
  experimental: {
    // Server components
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
}

module.exports = nextConfig