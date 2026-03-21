import Link from 'next/link'

export default function RefundPolicyPage() {
  return (
    <div className="section-padding bg-white min-h-screen">
      <div className="container mx-auto max-w-4xl">
        
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <span className="text-neutral-700">Refund Policy</span>
        </nav>

        <div className="prose prose-lg max-w-none">
          <h1 className="font-display font-bold text-4xl text-primary-600 mb-8">
            Refund Policy
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              💰 Refund Overview
            </h2>
            <p className="text-blue-800">
              At Crystal Harbor Trading Company, we're committed to your satisfaction. This policy 
              outlines when and how refunds are processed for our custom printed products.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Refund Eligibility
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-3">✅ Full Refund Eligible:</h3>
                <ul className="text-green-800 space-y-2 text-sm">
                  <li>• Defective products due to printing errors</li>
                  <li>• Incorrect items shipped (our mistake)</li>
                  <li>• Damaged items received</li>
                  <li>• Order cancellation before printing begins</li>
                  <li>• Significant quality issues with materials</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Partial Refund Eligible:</h3>
                <ul className="text-yellow-800 space-y-2 text-sm">
                  <li>• Order cancellation after printing begins</li>
                  <li>• Customer error in approved design</li>
                  <li>• Minor color variations within acceptable range</li>
                  <li>• Size exchanges (subject to restocking fee)</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-3">❌ No Refund:</h3>
              <ul className="text-red-800 space-y-2">
                <li>• Custom printed items delivered as ordered and approved</li>
                <li>• Orders beyond 30-day return window</li>
                <li>• Items damaged by customer after delivery</li>
                <li>• Change of mind on approved custom designs</li>
                <li>• Digital proof errors approved by customer</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Refund Timeline
            </h2>
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">1-2</span>
                  </div>
                  <h3 className="text-lg font-semibold">Business Days: Return Request Review</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  We'll review your return request and photos, then provide approval or additional instructions.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">2-3</span>
                  </div>
                  <h3 className="text-lg font-semibold">Business Days: Item Inspection</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Once we receive the returned item, our quality team will inspect it to determine refund eligibility.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 font-bold">5-7</span>
                  </div>
                  <h3 className="text-lg font-semibold">Business Days: Refund Processing</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Approved refunds are processed back to your original payment method within 5-7 business days.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Refund Types & Amounts
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 bg-green-50 p-4">
                <h3 className="font-semibold text-green-900 mb-2">💰 Full Refund (100%)</h3>
                <ul className="text-green-800 space-y-1 text-sm">
                  <li>• Product cost + original shipping + return shipping covered</li>
                  <li>• Applied when the error is entirely on our end</li>
                  <li>• Includes defects, wrong items, or damaged shipments</li>
                </ul>
              </div>

              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">🔄 Partial Refund (Variable)</h3>
                <ul className="text-yellow-800 space-y-1 text-sm">
                  <li>• Product cost minus 15-25% restocking fee</li>
                  <li>• Customer pays return shipping</li>
                  <li>• Applied for customer-initiated changes or minor issues</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💳 Store Credit</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Full product value as store credit</li>
                  <li>• Valid for 12 months from issue date</li>
                  <li>• Can be used for any future orders</li>
                  <li>• Often offered as an alternative to partial refunds</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Payment Method Considerations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-3">💳 Credit/Debit Cards</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Refunded to original card</li>
                  <li>• May take 3-5 additional business days to appear</li>
                  <li>• Bank processing times vary</li>
                  <li>• Refund will show as credit from Crystal Harbor</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold mb-3">🏪 Store Credit</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Issued immediately upon approval</li>
                  <li>• 12-month expiration period</li>
                  <li>• Can be combined with other payments</li>
                  <li>• Transferable to others upon request</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Special Circumstances
            </h2>
            
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-900 mb-3">🎨 Design Approval Process</h3>
                <p className="text-purple-800 mb-3">
                  All custom orders include a digital proof approval process. Once you approve a design:
                </p>
                <ul className="text-purple-800 space-y-1 text-sm">
                  <li>• Refunds for design errors are limited</li>
                  <li>• We're not responsible for spelling/layout mistakes you approved</li>
                  <li>• Color variations within industry standards are expected</li>
                  <li>• We'll work with you on reasonable adjustments</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-semibold text-orange-900 mb-3">🚛 Large Orders (100+ Units)</h3>
                <p className="text-orange-800 mb-3">
                  Bulk orders have special considerations:
                </p>
                <ul className="text-orange-800 space-y-1 text-sm">
                  <li>• Require manual review for refund approval</li>
                  <li>• May qualify for partial completion discounts</li>
                  <li>• Custom timelines for inspection and processing</li>
                  <li>• Direct contact with account manager required</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              How to Request a Refund
            </h2>
            
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold mr-4 mt-1">1</span>
                <div>
                  <h3 className="font-semibold mb-1">Contact Our Support Team</h3>
                  <p className="text-gray-600 mb-2">
                    Email us at <a href="mailto:support@crystalharbortc.com" className="text-accent-coral-500 hover:underline">support@crystalharbortc.com</a> with:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Order number</li>
                    <li>• Reason for refund request</li>
                    <li>• Photos of any defects or issues</li>
                    <li>• Preferred resolution (refund, credit, replacement)</li>
                  </ul>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold mr-4 mt-1">2</span>
                <div>
                  <h3 className="font-semibold mb-1">Receive Authorization</h3>
                  <p className="text-gray-600">
                    We'll review your request and provide a Return Merchandise Authorization (RMA) 
                    number along with return instructions.
                  </p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold mr-4 mt-1">3</span>
                <div>
                  <h3 className="font-semibold mb-1">Return the Item</h3>
                  <p className="text-gray-600">
                    Package the item securely with the RMA number clearly marked and ship it back 
                    using the provided return label (if applicable).
                  </p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold mr-4 mt-1">4</span>
                <div>
                  <h3 className="font-semibold mb-1">Refund Processing</h3>
                  <p className="text-gray-600">
                    Once we receive and inspect the item, we'll process your refund according to 
                    the timeline outlined above.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary-600 mb-4">
              Questions or Concerns?
            </h2>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="mb-4">
                <strong>We're here to help resolve any issues with your order:</strong>
              </p>
              <div className="space-y-2">
                <p>📧 Email: <a href="mailto:support@crystalharbortc.com" className="text-accent-coral-500 hover:underline">support@crystalharbortc.com</a></p>
                <p>📞 Phone: (555) 123-4567</p>
                <p>🕒 Business Hours: Monday - Friday, 9 AM - 5 PM EST</p>
                <p>📍 Address: Crystal Harbor Trading Company, [City, State]</p>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> The faster you contact us about issues, the more options 
                  we have to resolve them. Don't wait if you notice a problem with your order!
                </p>
              </div>
            </div>
          </section>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              This refund policy was last updated on March 5, 2026. We reserve the right to 
              update this policy at any time. All refunds are subject to inspection and approval.
            </p>
          </div>

        </div>

        {/* Navigation Links */}
        <div className="mt-12 flex justify-center space-x-6">
          <Link 
            href="/returns" 
            className="btn-outline"
          >
            Return Policy
          </Link>
          <Link 
            href="/products" 
            className="btn-primary"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}