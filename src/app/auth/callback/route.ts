import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES } from '@/config/routes';

const callbackErrorPath = `${ROUTES.LOGIN}?error=oauth`;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!code || !url || !key) {
    return NextResponse.redirect(new URL(callbackErrorPath, request.url));
  }

  const response = NextResponse.redirect(new URL(ROUTES.OWNER_DASHBOARD, request.url));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL(callbackErrorPath, request.url));
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  const destination = role?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.OWNER_DASHBOARD;
  response.headers.set('Location', new URL(destination, request.url).toString());
  return response;
}
