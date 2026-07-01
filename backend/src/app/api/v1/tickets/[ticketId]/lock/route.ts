import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError, noContent, ok } from '@/lib/http';
import { LockTicketSchema } from '@/lib/schemas';
import { lockTicket, unlockTicket } from '@/lib/locks';
const Params = z.object({ ticketId: z.string().uuid() });
export async function POST(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) { try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); const payload = LockTicketSchema.parse(await request.json().catch(() => ({}))); return ok({ lock: await lockTicket(user, ticketId, payload.timeoutSeconds) }); } catch (error) { return handleRouteError(error); } }
export async function DELETE(_request: NextRequest, context: { params: Promise<{ ticketId: string }> }) { try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); await unlockTicket(user, ticketId); return noContent(); } catch (error) { return handleRouteError(error); } }
