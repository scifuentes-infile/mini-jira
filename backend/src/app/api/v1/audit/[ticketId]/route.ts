import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { listAuditLogs } from '@/lib/audit';
const Params = z.object({ ticketId: z.string().uuid() });
const Query = z.object({ limit: z.coerce.number().int().min(1).max(100).optional().default(50), offset: z.coerce.number().int().min(0).optional().default(0) });
export async function GET(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) { try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); const query = Query.parse(Object.fromEntries(request.nextUrl.searchParams)); return ok(await listAuditLogs(user, ticketId, query.limit, query.offset)); } catch (error) { return handleRouteError(error); } }
