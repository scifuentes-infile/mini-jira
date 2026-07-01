
import { pool } from '@/lib/supabase';
import type { CurrentUser } from '@/lib/auth';
import { HttpError } from '@/lib/http';
import { getTicketOrThrow } from '@/lib/tickets';

type LockRow = {
  ticket_id: string;
  locked_by: string;
  locked_at: Date | string;
  expires_at: Date | string;
  username: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  avatar_url: string | null;
};

const toIso = (value: Date | string) => new Date(value).toISOString();
const presentLock = (row: LockRow) => ({
  ticketId: row.ticket_id,
  lockedBy: { id: row.locked_by, username: row.username, name: row.name, email: row.email, status: row.status, avatarUrl: row.avatar_url },
  lockedAt: toIso(row.locked_at),
  expiresAt: toIso(row.expires_at),
});

export const lockTicket = async (user: CurrentUser, ticketId: string, timeoutSeconds: number) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await getTicketOrThrow(ticketId, user, client);
    await client.query('delete from public.ticket_locks where ticket_id = $1 and expires_at < now()', [ticketId]);
    const current = await client.query<LockRow>(
      `select tl.ticket_id, tl.locked_by, tl.locked_at, tl.expires_at, u.username, u.name, u.email, u.status, u.avatar_url
       from public.ticket_locks tl join public.users u on u.id = tl.locked_by
       where tl.ticket_id = $1 for update`,
      [ticketId],
    );
    const existing = current.rows[0];
    if (existing && existing.locked_by !== user.id) {
      throw new HttpError(409, { code: 'VERSION_CONFLICT', message: 'El ticket esta bloqueado por otro usuario.', details: { lock: presentLock(existing) } });
    }
    const expiresAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString();
    const upsert = await client.query<LockRow>(
      `insert into public.ticket_locks (ticket_id, locked_by, locked_at, expires_at)
       values ($1, $2, now(), $3)
       on conflict (ticket_id) do update set locked_by = excluded.locked_by, locked_at = now(), expires_at = excluded.expires_at
       returning ticket_id, locked_by, locked_at, expires_at,
         (select username from public.users where id = locked_by) as username,
         (select name from public.users where id = locked_by) as name,
         (select email from public.users where id = locked_by) as email,
         (select status from public.users where id = locked_by) as status,
         (select avatar_url from public.users where id = locked_by) as avatar_url`,
      [ticketId, user.id, expiresAt],
    );
    await client.query('commit');
    return presentLock(upsert.rows[0]);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const unlockTicket = async (user: CurrentUser, ticketId: string) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await getTicketOrThrow(ticketId, user, client);
    await client.query('delete from public.ticket_locks where ticket_id = $1 and expires_at < now()', [ticketId]);
    const current = await client.query<LockRow>(
      `select tl.ticket_id, tl.locked_by, tl.locked_at, tl.expires_at, u.username, u.name, u.email, u.status, u.avatar_url
       from public.ticket_locks tl join public.users u on u.id = tl.locked_by
       where tl.ticket_id = $1 for update`,
      [ticketId],
    );
    const existing = current.rows[0];
    if (existing && existing.locked_by !== user.id && user.role !== 'admin') {
      throw new HttpError(409, { code: 'VERSION_CONFLICT', message: 'El ticket esta bloqueado por otro usuario.', details: { lock: presentLock(existing) } });
    }
    await client.query('delete from public.ticket_locks where ticket_id = $1', [ticketId]);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};
