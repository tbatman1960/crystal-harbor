/** Next embeds SITE_URL from next.config.mjs separately for each deploy preview.
 * Keep the direct process.env access: aliasing process.env hides it from Next's compiler.
 */
export function siteUrl(env?: Record<string, string | undefined>) {
  if (!env)
    return (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return (
    env.CONTEXT === 'deploy-preview' && env.DEPLOY_PRIME_URL
      ? env.DEPLOY_PRIME_URL
      : env.SITE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');
}
