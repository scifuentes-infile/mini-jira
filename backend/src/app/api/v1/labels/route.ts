import { requireUser } from "@/lib/auth";
import { handleRouteError, ok } from "@/lib/http";
import { getCompat } from "@/lib/schema-compat";
import { pool } from "@/lib/supabase";

export async function GET() {
  try {
    await requireUser();
    const compat = await getCompat();
    const result = await pool.query(
      `select id, name, color from public.${compat.labelsTable} order by name asc`,
    );

    return ok({
      items: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
