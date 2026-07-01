import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { pool } from '@/lib/supabase';
import { env } from '@/lib/env';
import { HttpError } from '@/lib/http';

export type CurrentUser = { id: string; username: string; name: string; email: string; role: 'admin' | 'user'; status: 'active' | 'inactive'; avatarUrl: string | null; createdAt: string; updatedAt: string };
const cookieName = 'mini_jira_session';
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const sign = (value: string) => crypto.createHmac('sha256', env.sessionSecret).update(value).digest('hex');
const safeEqual = (a: string, b: string) => { const ab = Buffer.from(a); const bb = Buffer.from(b); return ab.length === bb.length && crypto.timingSafeEqual(ab, bb); };

export const toUser = (row: Record<string, unknown>): CurrentUser => ({
  id: String(row.id), username: String(row.username), name: String(row.name), email: String(row.email), role: row.role as CurrentUser['role'], status: row.status as CurrentUser['status'], avatarUrl: row.avatar_url == null ? null : String(row.avatar_url), createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString(),
});
const sessionsTableExists = async () => (await pool.query<{ exists: boolean }>("select to_regclass('public.sessions') is not null as exists")).rows[0]?.exists === true;
export const setSessionCookie = async (userId: string) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const hasSessions = await sessionsTableExists();
  if (hasSessions) await pool.query('insert into public.sessions (user_id, token_hash, expires_at) values ($1, $2, $3)', [userId, sha256(token), expiresAt.toISOString()]);
  const store = await cookies();
  store.set(cookieName, hasSessions ? token : `${userId}.${sign(userId)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: expiresAt });
};
export const clearSessionCookie = async () => {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (token && await sessionsTableExists()) await pool.query('update public.sessions set revoked_at = now() where token_hash = $1 and revoked_at is null', [sha256(token)]);
  store.delete(cookieName);
};
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  let userId: string | null = null;
  if (await sessionsTableExists()) {
    userId = (await pool.query<{ user_id: string }>('select user_id from public.sessions where token_hash = $1 and revoked_at is null and expires_at > now() limit 1', [sha256(token)])).rows[0]?.user_id ?? null;
  } else {
    const [id, signature] = token.split('.');
    if (id && signature && safeEqual(sign(id), signature)) userId = id;
  }
  if (!userId) return null;
  const result = await pool.query('select * from public.users where id = $1 and status = $2 limit 1', [userId, 'active']);
  return result.rows[0] ? toUser(result.rows[0]) : null;
};
export const requireUser = async () => {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, { code: 'UNAUTHENTICATED', message: 'No hay sesion valida.' });
  return user;
};
