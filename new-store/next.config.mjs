// Each Netlify PR preview uses its own origin for forms and redirects.
const siteUrl =
  process.env.CONTEXT === 'deploy-preview'
    ? process.env.DEPLOY_PRIME_URL || process.env.SITE_URL
    : process.env.SITE_URL;
export default {
  env: { SITE_URL: siteUrl || 'http://localhost:3000' },
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};
