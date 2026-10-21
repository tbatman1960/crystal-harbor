/** Preview deployments must never inherit a production Stripe secret. */
export function assertPaymentMode(key: string, siteUrl: string, context = '') {
  const isPreview =
    ['deploy-preview', 'branch-deploy'].includes(context) ||
    new URL(siteUrl).hostname.startsWith('deploy-preview-');
  if (isPreview && !key.startsWith('sk_test_')) {
    throw new Error(
      'Stripe test-mode credentials are required on a preview deployment.',
    );
  }
}
