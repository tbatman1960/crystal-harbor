'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'
import NewsletterSignup from './NewsletterSignup'
import { hasPopupBeenShown, setPopupShownCookie, setupExitIntentDetection } from '@/lib/email-capture'

interface EmailCapturePopupProps {
  delaySeconds?: number
  enableExitIntent?: boolean
}

export default function EmailCapturePopup({ 
  delaySeconds = 30, 
  enableExitIntent = true 
}: EmailCapturePopupProps) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const [isVisible, setIsVisible] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isAdmin) return
    // Don't show popup if it's already been shown
    if (hasPopupBeenShown()) {
      return
    }

    // Set up delay timer
    const delayTimer = setTimeout(() => {
      setIsVisible(true)
    }, delaySeconds * 1000)

    // Set up exit intent detection
    let exitIntentCleanup: (() => void) | undefined

    if (enableExitIntent && !hasPopupBeenShown()) {
      exitIntentCleanup = setupExitIntentDetection(() => {
        if (!hasPopupBeenShown()) {
          setIsVisible(true)
        }
      })
    }

    return () => {
      clearTimeout(delayTimer)
      if (exitIntentCleanup) {
        exitIntentCleanup()
      }
    }
  }, [delaySeconds, enableExitIntent])

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure smooth animation
      setTimeout(() => setShowPopup(true), 50)
    }
  }, [isVisible])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setShowPopup(false)
      setIsVisible(false)
    }, 300) // Match animation duration
    
    // Set cookie to prevent showing popup again
    setPopupShownCookie()
  }

  const handleSuccess = (email: string, discountCode?: string) => {
    // Popup will show success state automatically
    // Mark as shown after a delay to let user see the success message
    setTimeout(() => {
      setPopupShownCookie()
    }, 3000)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isVisible || isAdmin) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4
          transition-opacity duration-300 ease-in-out
          ${showPopup && !isClosing ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleBackdropClick}
      >
        {/* Modal */}
        <div 
          className={`
            bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto
            transform transition-all duration-300 ease-in-out
            ${showPopup && !isClosing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 transition-colors rounded-full hover:bg-secondary-100"
              aria-label="Close popup"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            
            {/* Decorative elements */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-accent-coral-500 to-accent-lime-500 rounded-full mb-4">
                <span className="text-2xl text-white">🎁</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <NewsletterSignup 
              source="popup" 
              showDiscountOffer={true}
              onSuccess={handleSuccess}
              className=""
            />
            
            <div className="mt-4 pt-4 border-t border-secondary-100">
              <p className="text-xs text-secondary-500 text-center">
                By subscribing, you agree to receive marketing emails from Crystal Harbor Trading Company. 
                You can unsubscribe at any time. 
                <br />
                <a href="/privacy" className="text-accent-coral-500 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add body scroll lock when popup is visible */}
      <style jsx global>{`
        ${showPopup && !isClosing ? 'body { overflow: hidden; }' : ''}
      `}</style>
    </>
  )
}