/** Netlify supplies a trusted per-preview URL; never derive redirects from request headers. */
export function siteUrl(env: Record<string, string | undefined> = process.env) {
  return (
    env.CONTEXT === 'deploy-preview' && env.DEPLOY_PRIME_URL
      ? env.DEPLOY_PRIME_URL
      : env.SITE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');
}
