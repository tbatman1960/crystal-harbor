import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Crystal Harbor Trading Company',
  description: 'Privacy policy for Crystal Harbor Trading Company - how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="section-padding bg-white">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display font-bold text-4xl text-primary-600 mb-4">
            Privacy Policy
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
              Please consult with a qualified attorney to create a proper privacy policy for your business.
            </p>
          </div>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, 
            place an order, or contact us for support.
          </p>

          <h3>Personal Information</h3>
          <ul>
            <li>Name and contact information (email, phone, address)</li>
            <li>Shipping and billing addresses</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Account credentials (email and encrypted password)</li>
            <li>Design files and custom text for orders</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <ul>
            <li>IP address and browser information</li>
            <li>Pages visited and time spent on our site</li>
            <li>Device and operating system information</li>
            <li>Referral source (how you found our website)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders and account</li>
            <li>Provide customer support</li>
            <li>Improve our website and services</li>
            <li>Send promotional communications (with your consent)</li>
            <li>Detect and prevent fraud</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information. We may share your information with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Third-party vendors who help us operate our business (payment processing, shipping, etc.)</li>
            <li><strong>Manufacturing Partners:</strong> Information necessary to fulfill your custom orders</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          </ul>

          <h2>4. Third-Party Services</h2>
          <p>Our website uses the following third-party services:</p>
          <ul>
            <li><strong>Stripe:</strong> Payment processing (see Stripe's privacy policy)</li>
            <li><strong>Supabase:</strong> Database and file storage</li>
            <li><strong>Vercel/Netlify:</strong> Website hosting (if deployed)</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information:
          </p>
          <ul>
            <li>SSL encryption for data transmission</li>
            <li>Secure password hashing</li>
            <li>Limited access to personal information</li>
            <li>Regular security updates and monitoring</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services 
            and fulfill the purposes outlined in this policy. Order information is kept for 
            business and legal requirements.
          </p>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and update your account information</li>
            <li>Delete your account (subject to order history requirements)</li>
            <li>Opt out of promotional communications</li>
            <li>Request information about data we have collected</li>
          </ul>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to improve your experience on our website. 
            These may include:
          </p>
          <ul>
            <li>Essential cookies for website functionality</li>
            <li>Analytics cookies to understand site usage</li>
            <li>Preference cookies to remember your settings</li>
          </ul>

          <h2>9. Children's Privacy</h2>
          <p>
            Our services are not directed to children under 13. We do not knowingly collect 
            personal information from children under 13. If we become aware of such collection, 
            we will take steps to delete the information.
          </p>

          <h2>10. International Users</h2>
          <p>
            Our services are intended for users in the United States. If you are accessing 
            our services from outside the US, please be aware that your information may be 
            transferred to and processed in the United States.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any 
            material changes by posting the new policy on this page with an updated date.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our data practices, please contact us:
            <br />Email: support@crystalharbortc.com
            <br />Phone: (317) 997-5503
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <h3 className="text-blue-800 font-semibold mb-2">🔒 Your Privacy Matters</h3>
            <p className="text-blue-700 text-sm">
              We are committed to protecting your privacy and being transparent about our data practices. 
              If you have any questions or concerns, please don't hesitate to contact us.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8">
            <p className="text-red-800 font-semibold mb-2">⚖️ Legal Disclaimer</p>
            <p className="text-red-700 text-sm">
              This privacy policy document is a template for demonstration purposes only. 
              It is not legal advice and should be reviewed and customized by a qualified attorney 
              before use in any business. Consider consulting with privacy law specialists for 
              GDPR, CCPA, and other regulatory compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}