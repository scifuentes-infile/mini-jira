import { requireUser } from "@/lib/auth";
import { handleRouteError, ok } from "@/lib/http";
import { pool } from "@/lib/supabase";

export async function GET() {
  try {
    await requireUser();
    const result = await pool.query(
      "select id, username, name, email, role, status, avatar_url, created_at, updated_at from public.users order by name asc",
    );

    return ok({
      items: result.rows.map((row) => ({
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        avatarUrl: row.avatar_url,
        createdAt: new Date(String(row.created_at)).toISOString(),
        updatedAt: new Date(String(row.updated_at)).toISOString(),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
