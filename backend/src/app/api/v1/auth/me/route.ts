import { getCurrentUser } from '@/lib/auth';
import { handleRouteError, ok } from '@/lib/http';
export async function GET() { try { return ok({ user: await getCurrentUser() }); } catch (error) { return handleRouteError(error); } }
