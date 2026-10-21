import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return response;
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(
          values: { name: string; value: string; options: CookieOptions }[],
        ) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user)
      return NextResponse.redirect(new URL('/auth?mode=login', request.url));
    const { data } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!data?.is_admin) return new NextResponse('Forbidden', { status: 403 });
  }
  return response;
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron).*)',
  ],
};
