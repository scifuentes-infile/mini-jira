import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { UpdateTicketSchema } from '@/lib/schemas';
import { getTicketOrThrow, presentTicket, updateTicket } from '@/lib/tickets';
const Params = z.object({ ticketId: z.string().uuid() });
export async function GET(_request: NextRequest, context: { params: Promise<{ ticketId: string }> }) { try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); return ok({ ticket: await presentTicket(await getTicketOrThrow(ticketId, user)) }); } catch (error) { return handleRouteError(error); } }
export async function PUT(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) { try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); const payload = UpdateTicketSchema.parse(await request.json()); return ok({ ticket: await updateTicket(user, ticketId, payload) }); } catch (error) { return handleRouteError(error); } }

export async function PATCH(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) {
  try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); const payload = UpdateTicketSchema.parse(await request.json()); return ok({ ticket: await updateTicket(user, ticketId, payload) }); } catch (error) { return handleRouteError(error); }
}
