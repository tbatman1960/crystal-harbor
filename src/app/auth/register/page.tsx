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
            <div className="font-display font-bold text-2xl text-primary-600">
              Crys<span className="text-accent-lime-500">tal</span> Har<span className="text-accent-coral-500">bor</span>
            </div>
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