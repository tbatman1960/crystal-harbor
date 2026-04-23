import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'

export const metadata = {
  title: 'Sign In - DearPast',
  description: 'Sign in to your DearPast account to track orders and manage your profile.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; reason?: string }
}) {
  const redirectTo = searchParams.redirectTo || '/'
  const reason = searchParams.reason

  return (
    <div className="section-padding bg-background-50 min-h-screen">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="font-script text-4xl text-primary-600 tracking-wide">
              DearPast
            </span>
          </Link>
        </div>

        {reason === 'customization' && (
          <div className="max-w-md mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 text-sm font-medium">
              Please sign in or create an account to customize your product. We need your account to save your design.
            </p>
          </div>
        )}

        <LoginForm redirectTo={redirectTo} showRegisterLink={true} />

        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}