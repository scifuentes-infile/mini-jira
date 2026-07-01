import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
import { ChangePositionSchema } from '@/lib/schemas';
import { changePosition } from '@/lib/tickets';
const Params = z.object({ ticketId: z.string().uuid() });
export async function PATCH(request: NextRequest, context: { params: Promise<{ ticketId: string }> }) { try { const user = await requireUser(); const { ticketId } = Params.parse(await context.params); const payload = ChangePositionSchema.parse(await request.json()); return ok({ ticket: await changePosition(user, ticketId, payload) }); } catch (error) { return handleRouteError(error); } }
