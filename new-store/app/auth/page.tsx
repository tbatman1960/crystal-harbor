import { AuthForm } from '@/components/auth-form';
export default function Auth({
  searchParams,
}: {
  searchParams: { mode?: string; error?: string; next?:string };
}) {
  const mode = ['login', 'register', 'reset', 'update'].includes(
    searchParams.mode || '',
  )
    ? searchParams.mode!
    : 'login';
  return <AuthForm mode={mode} error={searchParams.error} next={searchParams.next==='/studio'?'/studio':undefined} />;
}
