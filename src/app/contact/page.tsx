'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>()

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          data: {
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      setIsSubmitted(true)
      reset()
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('There was an error sending your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="section-padding bg-background-50">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-600 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Have questions about custom printing? We're here to help make your vision a reality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <div className="card p-6">
              <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6">
                Get In Touch
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-coral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <EnvelopeIcon className="w-6 h-6 text-accent-coral-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-700 mb-1">Email</h3>
                    <p className="text-secondary-600">info@crystalharbortc.com</p>
                    <p className="text-sm text-secondary-500">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-accent-lime-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="w-6 h-6 text-accent-lime-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-700 mb-1">Phone</h3>
                    <p className="text-secondary-600">(317) 997-5503</p>
                    <p className="text-sm text-secondary-500">Monday - Friday, 9 AM - 5 PM EST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-700 mb-1">Address</h3>
                    <p className="text-secondary-600">
                      DearPast<br />
                      2307 Willow Lakes East Blvd<br />
                      Greenwood, Indiana 46143
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-700 mb-1">Hours</h3>
                    <p className="text-secondary-600">
                      Monday - Friday<br />
                      9:00 AM - 5:00 PM EST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="card p-6">
              <h3 className="font-display font-semibold text-xl text-primary-600 mb-4">
                Quick Answers
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-neutral-700 mb-1">How long do orders take?</h4>
                  <p className="text-sm text-secondary-600">2-3 weeks for custom printed items</p>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-700 mb-1">What file formats do you accept?</h4>
                  <p className="text-sm text-secondary-600">PNG, JPG, SVG, and PDF files up to 50MB</p>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-700 mb-1">Do you have minimum orders?</h4>
                  <p className="text-sm text-secondary-600">No minimums! Order as few as 1 item</p>
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-700 mb-1">Can I see a proof before printing?</h4>
                  <p className="text-sm text-secondary-600">Yes, we review all orders and contact you if needed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6">
                Send Us a Message
              </h2>

              {isSubmitted && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <span>✅</span>
                    <span>Thank you! We've received your message and will respond within 24 hours.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="input-field"
                      {...register('name', { required: 'Name is required' })}
                    />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="input-field"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    className="input-field"
                    placeholder="What can we help you with?"
                    {...register('subject', { required: 'Subject is required' })}
                  />
                  {errors.subject && <p className="form-error">{errors.subject.message}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    className="input-field resize-none"
                    placeholder="Tell us about your project, questions, or how we can help..."
                    {...register('message', {
                      required: 'Message is required',
                      minLength: {
                        value: 10,
                        message: 'Message must be at least 10 characters',
                      },
                    })}
                  />
                  {errors.message && <p className="form-error">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Sending Message...</span>
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 rounded-2xl p-8 text-white">
            <h2 className="font-display font-bold text-2xl mb-4">
              Need Help With Your Design?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Not sure about file formats, sizing, or design ideas? Our team is here to help you create the perfect custom product.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@crystalharbortc.com"
                className="bg-white text-accent-coral-500 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-block"
              >
                Email Design Support
              </a>
              <a
                href="tel:(317)997-5503"
                className="bg-white text-accent-lime-500 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-block"
              >
                Call Design Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}