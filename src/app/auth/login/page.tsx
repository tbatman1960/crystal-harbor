import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'

export const metadata = {
  title: 'Sign In - Crystal Harbor Trading Company',
  description: 'Sign in to your Crystal Harbor account to track orders and manage your profile.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string }
}) {
  const redirectTo = searchParams.redirectTo || '/'

  return (
    <div className="section-padding bg-background-50 min-h-screen">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="font-script text-4xl text-primary-600 tracking-wide">
              Crystal Harbor
            </span>
          </Link>
        </div>

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