import Link from 'next/link'
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export const metadata = {
  title: 'You\'re Offline - Crystal Harbor Trading Company',
  description: 'You\'re currently offline. Check your internet connection to continue shopping.',
}

export default function OfflinePage() {
  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mx-auto w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mb-8">
          <WifiIcon className="w-12 h-12 text-secondary-500" />
        </div>

        {/* Content */}
        <h1 className="font-display font-bold text-2xl text-neutral-900 mb-4">
          You're Offline
        </h1>
        
        <p className="text-secondary-600 mb-6 leading-relaxed">
          It looks like you've lost your internet connection. Don't worry – you can still browse 
          some cached pages while offline.
        </p>

        {/* Cached Pages Available */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📱 Available Offline:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Homepage and product catalog</li>
            <li>• Your shopping cart</li>
            <li>• Account information</li>
            <li>• Previously viewed products</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <Link 
            href="/"
            className="w-full btn-outline block text-center"
          >
            Browse Cached Pages
          </Link>
        </div>

        {/* Offline Features */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">🔄 When You're Back Online:</h4>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>• Cart items will be synchronized</li>
            <li>• Any pending orders will be submitted</li>
            <li>• Product information will be updated</li>
            <li>• You'll get the latest prices and availability</li>
          </ul>
        </div>

        {/* Tips */}
        <div className="mt-6 text-xs text-secondary-500">
          <p>💡 Tip: This app works offline thanks to Progressive Web App technology!</p>
        </div>
      </div>
    </div>
  )
}