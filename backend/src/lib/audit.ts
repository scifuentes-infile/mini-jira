
import { pool } from '@/lib/supabase';
import type { CurrentUser } from '@/lib/auth';
import { getCompat } from '@/lib/schema-compat';
import { getTicketOrThrow } from '@/lib/tickets';

const toIso = (value: unknown) => new Date(String(value)).toISOString();

export const listAuditLogs = async (user: CurrentUser, ticketId: string, limit: number, offset: number) => {
  await getTicketOrThrow(ticketId, user);
  const compat = await getCompat();
  const count = await pool.query(`select count(*)::int as total from public.${compat.auditTable} where ticket_id = $1`, [ticketId]);
  const rows = await pool.query(
    `select a.*, u.id as actor_id, u.username, u.name, u.email, u.status, u.avatar_url
     from public.${compat.auditTable} a
     left join public.users u on u.id = a.actor_id
     where a.ticket_id = $1
     order by a.created_at desc
     limit $2 offset $3`,
    [ticketId, limit, offset],
  );
  return {
    items: rows.rows.map((row) => ({
      id: row.id,
      ticketId: row.ticket_id,
      actor: row.actor_id ? { id: row.actor_id, username: row.username, name: row.name, email: row.email, status: row.status, avatarUrl: row.avatar_url } : null,
      action: row.action,
      field: row.field,
      oldValue: row.old_value,
      newValue: row.new_value,
      createdAt: toIso(row.created_at),
    })),
    total: count.rows[0]?.total ?? 0,
    limit,
    offset,
  };
};
