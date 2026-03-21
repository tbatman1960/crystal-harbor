'use client'

import { useState, useEffect } from 'react'
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

interface MobilePaymentMethodsProps {
  amount: number
  currency?: string
  onApplePaySuccess?: (paymentData: any) => void
  onGooglePaySuccess?: (paymentData: any) => void
  onError?: (error: string) => void
  disabled?: boolean
}

// Apple Pay integration
declare global {
  interface Window {
    ApplePaySession?: any
    google?: {
      payments: {
        api: {
          PaymentsClient: any
          IsReadyToPayRequest: any
          PaymentDataRequest: any
        }
      }
    }
  }
}

export default function MobilePaymentMethods({
  amount,
  currency = 'USD',
  onApplePaySuccess,
  onGooglePaySuccess,
  onError,
  disabled = false
}: MobilePaymentMethodsProps) {
  const [applePayAvailable, setApplePayAvailable] = useState(false)
  const [googlePayAvailable, setGooglePayAvailable] = useState(false)
  const [loading, setLoading] = useState({ applePay: false, googlePay: false })

  useEffect(() => {
    checkPaymentMethodAvailability()
  }, [])

  const checkPaymentMethodAvailability = async () => {
    // Check Apple Pay availability
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
      setApplePayAvailable(true)
    }

    // Check Google Pay availability
    if (window.google?.payments?.api) {
      try {
        const paymentsClient = new window.google.payments.api.PaymentsClient({
          environment: 'TEST' // Change to 'PRODUCTION' for live
        })

        const isReadyToPayRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX']
            }
          }]
        }

        const isReadyToPay = await paymentsClient.isReadyToPay(isReadyToPayRequest)
        setGooglePayAvailable(isReadyToPay.result)
      } catch (error) {
        console.error('Google Pay availability check failed:', error)
        setGooglePayAvailable(false)
      }
    } else {
      setGooglePayAvailable(false)
    }
  }

  const handleApplePay = async () => {
    if (!applePayAvailable || disabled) return

    setLoading(prev => ({ ...prev, applePay: true }))

    try {
      const paymentRequest = {
        countryCode: 'US',
        currencyCode: currency,
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: 'Crystal Harbor Trading Company',
          amount: amount.toFixed(2),
          type: 'final'
        },
        merchantIdentifier: 'merchant.com.crystalharbortc' // Configure in production
      }

      const session = new window.ApplePaySession(3, paymentRequest)

      session.onvalidatemerchant = async (event: any) => {
        // In production, you'd validate with your backend
        try {
          const response = await fetch('/api/apple-pay/validate-merchant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validationURL: event.validationURL,
              displayName: 'Crystal Harbor Trading Company'
            })
          })

          if (response.ok) {
            const merchantSession = await response.json()
            session.completeMerchantValidation(merchantSession)
          } else {
            session.abort()
            onError?.('Apple Pay merchant validation failed')
          }
        } catch (error) {
          session.abort()
          onError?.('Apple Pay setup error')
        }
      }

      session.onpaymentauthorized = (event: any) => {
        // Process payment with your payment processor
        const payment = event.payment
        
        // For demo purposes, we'll simulate success
        const result = {
          status: window.ApplePaySession.STATUS_SUCCESS
        }

        session.completePayment(result)
        onApplePaySuccess?.(payment)
      }

      session.oncancel = () => {
        console.log('Apple Pay cancelled by user')
      }

      session.begin()
    } catch (error) {
      console.error('Apple Pay error:', error)
      onError?.('Apple Pay initialization failed')
    } finally {
      setLoading(prev => ({ ...prev, applePay: false }))
    }
  }

  const handleGooglePay = async () => {
    if (!googlePayAvailable || disabled) return

    setLoading(prev => ({ ...prev, googlePay: true }))

    try {
      if (!window.google?.payments?.api) {
        throw new Error('Google Pay API not available')
      }

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: 'TEST'
      })

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe', // Configure for your payment processor
              gatewayMerchantId: 'your-stripe-merchant-id'
            }
          }
        }],
        merchantInfo: {
          merchantId: 'your-google-merchant-id',
          merchantName: 'Crystal Harbor Trading Company'
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toFixed(2),
          currencyCode: currency,
          countryCode: 'US'
        }
      }

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest)
      onGooglePaySuccess?.(paymentData)
    } catch (error: any) {
      console.error('Google Pay error:', error)
      
      if (error?.statusCode === 'CANCELED') {
        console.log('Google Pay cancelled by user')
      } else {
        onError?.('Google Pay payment failed')
      }
    } finally {
      setLoading(prev => ({ ...prev, googlePay: false }))
    }
  }

  // Don't render if no mobile payment methods are available
  if (!applePayAvailable && !googlePayAvailable) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-4">
        <DevicePhoneMobileIcon className="h-5 w-5 text-secondary-600" />
        <span className="text-sm font-medium text-secondary-600">Mobile Payments</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Apple Pay */}
        {applePayAvailable && (
          <button
            onClick={handleApplePay}
            disabled={disabled || loading.applePay}
            className="w-full bg-black text-white rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading.applePay ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="font-semibold">Pay with</span>
                <span className="font-bold text-lg">Apple Pay</span>
              </>
            )}
          </button>
        )}

        {/* Google Pay */}
        {googlePayAvailable && (
          <button
            onClick={handleGooglePay}
            disabled={disabled || loading.googlePay}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading.googlePay ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-semibold">Google Pay</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Security Note */}
      <p className="text-xs text-secondary-500 text-center">
        🔒 Secure mobile payments with biometric authentication
      </p>
    </div>
  )
}