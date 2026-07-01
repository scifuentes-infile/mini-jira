import { pool } from '@/lib/supabase';

type Compat = { labelsTable: 'labels' | 'tags'; labelJoinTable: 'ticket_labels' | 'ticket_tags'; labelJoinColumn: 'label_id' | 'tag_id'; auditTable: 'audit_logs' | 'audit_log' };
let cached: Compat | null = null;
const exists = async (table: string) => (await pool.query<{ exists: boolean }>('select to_regclass($1) is not null as exists', [`public.${table}`])).rows[0]?.exists === true;
export const getCompat = async (): Promise<Compat> => {
  if (cached) return cached;
  const hasLabels = await exists('labels');
  const hasTicketLabels = await exists('ticket_labels');
  const hasAuditLogs = await exists('audit_logs');
  cached = { labelsTable: hasLabels ? 'labels' : 'tags', labelJoinTable: hasTicketLabels ? 'ticket_labels' : 'ticket_tags', labelJoinColumn: hasTicketLabels ? 'label_id' : 'tag_id', auditTable: hasAuditLogs ? 'audit_logs' : 'audit_log' };
  return cached;
};
