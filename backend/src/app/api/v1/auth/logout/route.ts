import { clearSessionCookie } from '@/lib/auth';
import { handleRouteError, noContent } from '@/lib/http';
export async function POST() { try { await clearSessionCookie(); return noContent(); } catch (error) { return handleRouteError(error); } }
