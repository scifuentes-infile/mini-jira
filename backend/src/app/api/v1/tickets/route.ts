import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { CreateTicketSchema, TicketListQuerySchema } from '@/lib/schemas';
import { createTicket, listTickets } from '@/lib/tickets';
export async function GET(request: NextRequest) { try { const user = await requireUser(); const query = TicketListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams)); return ok(await listTickets(user, query)); } catch (error) { return handleRouteError(error); } }
export async function POST(request: NextRequest) { try { const user = await requireUser(); const payload = CreateTicketSchema.parse(await request.json()); return ok({ ticket: await createTicket(user, payload) }, 201); } catch (error) { return handleRouteError(error); } }
