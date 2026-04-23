import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - DearPast',
  description: 'Terms of service and conditions for DearPast custom printing services.',
}

export default function TermsPage() {
  return (
    <div className="section-padding bg-white">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display font-bold text-4xl text-primary-600 mb-4">
            Terms of Service
          </h1>
          <p className="text-secondary-600">
            <strong>DRAFT - Legal review required</strong> • Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 font-semibold mb-2">⚠️ Legal Notice</p>
            <p className="text-yellow-700 text-sm">
              This is placeholder legal content for demonstration purposes. 
              Please consult with a qualified attorney to create proper terms of service for your business.
            </p>
          </div>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using DearPast's website and services, 
            you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2>2. Custom Printing Services</h2>
          <p>
            DearPast provides custom printing services on various products including 
            t-shirts, blankets, banners, and flags. All products are made to order based on customer specifications.
          </p>

          <h2>3. Order Process</h2>
          <ul>
            <li>Orders are processed upon receipt of payment and design files</li>
            <li>Production time is typically 2-3 weeks for custom printed items</li>
            <li>Large orders (100+ units) may require additional processing time</li>
            <li>We reserve the right to contact customers regarding design or order clarifications</li>
          </ul>

          <h2>4. Payment Terms</h2>
          <ul>
            <li>Payment is required in full at the time of order</li>
            <li>We accept major credit cards through Stripe</li>
            <li>Prices include product cost and standard processing</li>
            <li>Shipping costs are additional and calculated at checkout</li>
          </ul>

          <h2>5. Design Requirements</h2>
          <ul>
            <li>Customers are responsible for providing print-ready design files</li>
            <li>Accepted formats: PNG, JPG, SVG, PDF (up to 50MB)</li>
            <li>Customers warrant they have rights to use all submitted designs</li>
            <li>We are not responsible for copyright infringement in customer designs</li>
          </ul>

          <h2>6. Product Quality</h2>
          <p>
            We strive to ensure high-quality printing on all products. Color variations may occur 
            due to monitor differences and printing processes. We will contact customers if significant 
            design issues are identified before production.
          </p>

          <h2>7. Shipping and Delivery</h2>
          <ul>
            <li>Shipping within the United States only</li>
            <li>Standard shipping rates apply unless otherwise specified</li>
            <li>Delivery times are estimates and may vary</li>
            <li>Risk of loss passes to customer upon delivery to shipping carrier</li>
          </ul>

          <h2>8. Returns and Refunds</h2>
          <p>
            Due to the custom nature of our products, returns are generally not accepted unless 
            there is a manufacturing defect. See our Return Policy for detailed information.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            DearPast's liability is limited to the cost of the products ordered. 
            We are not liable for consequential, incidental, or special damages.
          </p>

          <h2>10. Privacy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy for information 
            about how we collect, use, and protect your personal information.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be posted on 
            this page with an updated date.
          </p>

          <h2>12. Contact Information</h2>
          <p>
            If you have questions about these terms, please contact us at:
            <br />Email: info@crystalharbortc.com
            <br />Phone: (317) 997-5503
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8">
            <p className="text-red-800 font-semibold mb-2">⚖️ Legal Disclaimer</p>
            <p className="text-red-700 text-sm">
              This terms of service document is a template for demonstration purposes only. 
              It is not legal advice and should be reviewed and customized by a qualified attorney 
              before use in any business.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}