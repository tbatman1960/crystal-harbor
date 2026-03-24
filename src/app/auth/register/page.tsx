import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'

export const metadata = {
  title: 'Create Account - Crystal Harbor Trading Company',
  description: 'Create your Crystal Harbor account to start ordering custom printed products.',
}

export default function RegisterPage({
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

        <RegisterForm redirectTo={redirectTo} />

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