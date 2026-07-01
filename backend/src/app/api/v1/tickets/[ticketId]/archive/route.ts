import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { VersionPayloadSchema } from '@/lib/schemas';
import { archiveTicket } from '@/lib/tickets';
const Params = z.object({ ticketId: z.string().uuid() });
export async function POST(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) { try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); const payload = VersionPayloadSchema.parse(await request.json()); return ok({ ticket: await archiveTicket(user, ticketId, payload.version) }); } catch (error) { return handleRouteError(error); } }
