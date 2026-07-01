import { NextRequest } from 'next/server';
import { pool } from '@/lib/supabase';
import { LoginSchema } from '@/lib/schemas';
import { fail, handleRouteError, ok } from '@/lib/http';
import { setSessionCookie, toUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const payload = LoginSchema.parse(await request.json());
    const result = await pool.query("select * from public.users where lower(email)=lower($1) and status='active' and (password_hash = crypt($2, password_hash) or password_hash = $2) limit 1", [payload.email, payload.password]);
    if (!result.rows[0]) return fail(401, { code: 'INVALID_CREDENTIALS', message: 'Credenciales invalidas.' });
    await setSessionCookie(result.rows[0].id);
    return ok({ user: toUser(result.rows[0]) });
  } catch (error) { return handleRouteError(error); }
}
