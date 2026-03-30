import Link from 'next/link'

export default function ReturnPolicyPage() {
  return (
    <div className="section-padding bg-white min-h-screen">
      <div className="container mx-auto max-w-4xl">
        
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <span className="text-neutral-700">Return Policy</span>
        </nav>

        <div className="prose prose-lg max-w-none">
          <h1 className="font-display font-bold text-4xl text-primary-600 mb-8">
            Return & Exchange Policy
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              📋 Quick Summary
            </h2>
            <ul className="text-blue-800 space-y-1">
              <li>• 30-day return window for defective items</li>
              <li>• Custom printed items are final sale unless defective</li>
              <li>• Return shipping covered for our errors</li>
              <li>• Refunds processed within 5-7 business days</li>
            </ul>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Return Eligibility
            </h2>
            <p className="mb-4">
              Due to the custom nature of our products, most items are final sale. However, we stand behind 
              the quality of our work and will accept returns in the following situations:
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-3">✅ Returnable Items:</h3>
              <ul className="text-green-800 space-y-2">
                <li>• Items with printing defects or quality issues</li>
                <li>• Incorrect products shipped (our error)</li>
                <li>• Items damaged during shipping</li>
                <li>• Significant color variations from approved proofs</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-3">❌ Non-Returnable Items:</h3>
              <ul className="text-red-800 space-y-2">
                <li>• Custom printed items (unless defective)</li>
                <li>• Items returned after 30 days</li>
                <li>• Items damaged by customer use</li>
                <li>• Items with customer design errors (if proof was approved)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              How to Return an Item
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-accent-coral-500 mb-2">01</div>
                <h3 className="font-semibold mb-2">Contact Us</h3>
                <p className="text-sm text-gray-600">
                  Email us at support@crystalharbortc.com with your order number and issue details.
                </p>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-accent-coral-500 mb-2">02</div>
                <h3 className="font-semibold mb-2">Get Authorization</h3>
                <p className="text-sm text-gray-600">
                  We'll review your request and provide a Return Merchandise Authorization (RMA) if approved.
                </p>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-accent-coral-500 mb-2">03</div>
                <h3 className="font-semibold mb-2">Ship It Back</h3>
                <p className="text-sm text-gray-600">
                  Package the item securely and ship it back using the provided return label.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h3>
              <ul className="text-yellow-800 space-y-1">
                <li>• Returns must be initiated within 30 days of delivery</li>
                <li>• Include RMA number on return package</li>
                <li>• Items must be in original condition</li>
                <li>• Take photos of defects before returning</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Refund Process
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Inspection</h3>
                  <p className="text-gray-600">
                    Once we receive your return, we'll inspect it within 2-3 business days.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Approval</h3>
                  <p className="text-gray-600">
                    If the return meets our criteria, we'll approve the refund and send you a confirmation email.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Processing</h3>
                  <p className="text-gray-600">
                    Refunds are processed to your original payment method within 5-7 business days.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Exchanges
            </h2>
            <p className="mb-4">
              Due to the custom nature of our products, we don't offer direct exchanges. If you need a 
              different size, color, or design modification, please:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Return the original item following our return process</li>
              <li>Place a new order with your desired specifications</li>
              <li>Contact us if you need expedited processing for the replacement</li>
            </ol>
            <p className="text-gray-600">
              For our errors (wrong size shipped, printing mistakes, etc.), we'll cover all costs 
              and expedite your replacement order at no additional charge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Damaged or Lost Shipments
            </h2>
            <p className="mb-4">
              If your order arrives damaged or doesn't arrive at all:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Contact us immediately with photos of damage (if applicable)</li>
              <li>We'll file a claim with the shipping carrier</li>
              <li>We'll send a replacement order at no charge</li>
              <li>Keep all packaging materials until the claim is resolved</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Contact Information
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="mb-4">
                <strong>For return requests and questions:</strong>
              </p>
              <div className="space-y-2">
                <p>📧 Email: <a href="mailto:support@crystalharbortc.com" className="text-accent-coral-500 hover:underline">support@crystalharbortc.com</a></p>
                <p>📞 Phone: (317) 997-5503</p>
                <p>🕒 Business Hours: Monday - Friday, 9 AM - 5 PM EST</p>
              </div>
              
              <p className="mt-4 text-sm text-gray-600">
                Please include your order number and detailed description of the issue 
                to help us process your request quickly.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Policy Updates
            </h2>
            <p className="text-gray-600">
              This return policy was last updated on March 5, 2026. We reserve the right to 
              update this policy at any time. Changes will be posted on this page and will 
              take effect immediately.
            </p>
          </section>

        </div>

        {/* Back to Shopping */}
        <div className="mt-12 text-center">
          <Link 
            href="/products" 
            className="btn-primary inline-flex items-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}