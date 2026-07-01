import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import { pool } from "@/lib/supabase";
import type { CurrentUser } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { getCompat } from "@/lib/schema-compat";
import type {
  ChangePositionSchema,
  ChangeStatusSchema,
  CreateTicketSchema,
  TicketListQuerySchema,
  UpdateTicketSchema,
} from "@/lib/schemas";

type TicketRow = Record<string, any>;
type Db = Pool | PoolClient;
type TicketListQuery = z.infer<typeof TicketListQuerySchema>;
type CreateTicket = z.infer<typeof CreateTicketSchema>;
type UpdateTicket = z.infer<typeof UpdateTicketSchema>;
type ChangeStatus = z.infer<typeof ChangeStatusSchema>;
type ChangePosition = z.infer<typeof ChangePositionSchema>;
const toIso = (value: unknown) =>
  value == null ? null : new Date(String(value)).toISOString();
const canEdit = (user: CurrentUser, row: TicketRow) =>
  user.role === "admin" || row.creator_id === user.id;
const canMove = (user: CurrentUser, row: TicketRow) =>
  user.role === "admin" || row.assignee_id === user.id;

const hydrateTickets = async (rows: TicketRow[]) => {
  if (!rows.length) return [];
  const compat = await getCompat();
  const ids = rows.map((row) => row.id);
  const userIds = Array.from(
    new Set(
      rows.flatMap((row) => [row.creator_id, row.assignee_id]).filter(Boolean),
    ),
  );
  const users = await pool.query(
    "select id, username, name, email, status, avatar_url from public.users where id = any($1::uuid[])",
    [userIds],
  );
  const usersById = new Map(
    users.rows.map((row) => [
      row.id,
      {
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        status: row.status,
        avatarUrl: row.avatar_url,
      },
    ]),
  );
  const labelRows = await pool
    .query(
      `select tl.ticket_id, l.id, l.name, l.color from public.${compat.labelJoinTable} tl join public.${compat.labelsTable} l on l.id = tl.${compat.labelJoinColumn} where tl.ticket_id = any($1::uuid[])`,
      [ids],
    )
    .catch(() => ({ rows: [] }));
  const labelsByTicket = new Map<string, unknown[]>();
  for (const row of labelRows.rows)
    labelsByTicket.set(row.ticket_id, [
      ...(labelsByTicket.get(row.ticket_id) ?? []),
      { id: row.id, name: row.name, color: row.color },
    ]);
  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    labels: labelsByTicket.get(row.id) ?? [],
    creator: usersById.get(row.creator_id) ?? null,
    assignee: row.assignee_id ? (usersById.get(row.assignee_id) ?? null) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    closedAt: toIso(row.closed_at),
    archivedAt: toIso(row.archived_at),
    position: row.position,
    version: row.version,
  }));
};
export const presentTicket = async (row: TicketRow) =>
  (await hydrateTickets([row]))[0];
export const getTicketOrThrow = async (
  ticketId: string,
  user: CurrentUser,
  db: Db = pool,
) => {
  const where =
    user.role === "admin"
      ? "true"
      : "(t.creator_id = $2 or t.assignee_id = $2)";
  const result = await db.query(
    `select * from public.tickets t where t.id = $1 and ${where} limit 1`,
    [ticketId, user.id],
  );
  if (!result.rows[0])
    throw new HttpError(404, {
      code: "NOT_FOUND",
      message: "Ticket inexistente o no visible.",
    });
  return result.rows[0];
};
export const listTickets = async (
  user: CurrentUser,
  query: TicketListQuery,
) => {
  const compat = await getCompat();
  const params: unknown[] = [];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };
  const where: string[] = [
    query.archived ? "t.archived_at is not null" : "t.archived_at is null",
  ];
  if (user.role !== "admin")
    where.push(
      `(t.creator_id = ${add(user.id)} or t.assignee_id = ${add(user.id)})`,
    );
  if (query.search)
    where.push(
      `(t.title ilike ${add("%" + query.search + "%")} or t.key ilike ${add("%" + query.search + "%")})`,
    );
  if (query.status) where.push(`t.status = ${add(query.status)}`);
  if (query.priority) where.push(`t.priority = ${add(query.priority)}`);
  if (query.assigneeId) where.push(`t.assignee_id = ${add(query.assigneeId)}`);
  if (query.creatorId) where.push(`t.creator_id = ${add(query.creatorId)}`);
  if (query.labelId)
    where.push(
      `exists (select 1 from public.${compat.labelJoinTable} tl where tl.ticket_id = t.id and tl.${compat.labelJoinColumn} = ${add(query.labelId)})`,
    );
  const sqlWhere = `where ${where.join(" and ")}`;
  const count = await pool.query(
    `select count(*)::int as total from public.tickets t ${sqlWhere}`,
    params,
  );
  const rows = await pool.query(
    `select t.* from public.tickets t ${sqlWhere} order by t.status, t.position, t.updated_at desc limit ${add(query.limit)} offset ${add(query.offset)}`,
    params,
  );
  return {
    items: await hydrateTickets(rows.rows),
    total: count.rows[0]?.total ?? 0,
    limit: query.limit,
    offset: query.offset,
  };
};
const writeAudit = async (
  client: PoolClient,
  actorId: string,
  ticketId: string,
  action: string,
  field: string | null,
  oldValue: unknown,
  newValue: unknown,
) => {
  const compat = await getCompat();
  await client.query(
    `insert into public.${compat.auditTable} (ticket_id, actor_id, action, field, old_value, new_value) values ($1,$2,$3,$4,$5,$6)`,
    [
      ticketId,
      actorId,
      action,
      field,
      oldValue == null ? null : String(oldValue),
      newValue == null ? null : String(newValue),
    ],
  );
};
const replaceLabels = async (
  client: PoolClient,
  ticketId: string,
  labelIds: string[],
) => {
  const compat = await getCompat();
  await client.query(
    `delete from public.${compat.labelJoinTable} where ticket_id = $1`,
    [ticketId],
  );
  for (const id of labelIds)
    await client.query(
      `insert into public.${compat.labelJoinTable} (ticket_id, ${compat.labelJoinColumn}) values ($1,$2) on conflict do nothing`,
      [ticketId, id],
    );
};
const assertVersion = async (row: TicketRow, version: number) => {
  if (row.version !== version)
    throw new HttpError(409, {
      code: "VERSION_CONFLICT",
      message: "El ticket fue modificado por otra persona.",
      details: { currentTicket: await presentTicket(row) },
    });
};
const getDefaultProjectId = async (db: PoolClient, user: CurrentUser) => {
  const existing = await db.query(
    "select id from public.projects where archived_at is null order by created_at asc limit 1",
  );
  if (existing.rows[0]?.id) return existing.rows[0].id as string;
  const inserted = await db.query(
    "insert into public.projects (key, name, description, owner_id) values ('MJ', 'Mini Jira', 'Proyecto default para tickets', $1) returning id",
    [user.id],
  );
  const projectId = inserted.rows[0].id as string;
  await db.query(
    "insert into public.project_members (project_id, user_id, role) values ($1, $2, 'owner') on conflict (project_id, user_id) do update set role = excluded.role",
    [projectId, user.id],
  );
  return projectId;
};
export const createTicket = async (
  user: CurrentUser,
  payload: CreateTicket,
) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const projectId = await getDefaultProjectId(client, user);
    const next = await client.query(
      "select coalesce(max(substring(key from '[0-9]+')::int),0)+1 as n from public.tickets where project_id = $1 and key ~ '^MJ-[0-9]+$'",
      [projectId],
    );
    const key = `MJ-${String(next.rows[0].n).padStart(3, "0")}`;
    const pos = await client.query(
      "select coalesce(max(position),-1)+1 as p from public.tickets where project_id = $1 and status='todo' and archived_at is null",
      [projectId],
    );
    const inserted = await client.query(
      "insert into public.tickets (project_id,key,title,description,status,priority,creator_id,assignee_id,position,version) values ($1,$2,$3,$4,'todo',$5,$6,$7,$8,1) returning *",
      [
        projectId,
        key,
        payload.title,
        payload.description,
        payload.priority,
        user.id,
        payload.assigneeId ?? null,
        pos.rows[0].p,
      ],
    );
    await replaceLabels(client, inserted.rows[0].id, payload.labelIds);
    await writeAudit(
      client,
      user.id,
      inserted.rows[0].id,
      "ticket_created",
      null,
      null,
      key,
    );
    await client.query("commit");
    return presentTicket(inserted.rows[0]);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
};
export const updateTicket = async (
  user: CurrentUser,
  ticketId: string,
  payload: UpdateTicket,
) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const row = await getTicketOrThrow(ticketId, user, client);
    if (!canEdit(user, row))
      throw new HttpError(403, {
        code: "FORBIDDEN",
        message: "No tienes permisos para editar este ticket.",
      });
    if (row.archived_at)
      throw new HttpError(422, {
        code: "ARCHIVED",
        message: "El ticket esta archivado.",
      });
    await assertVersion(row, payload.version);
    const next = {
      title: payload.title ?? row.title,
      description: payload.description ?? row.description,
      priority: payload.priority ?? row.priority,
      status: payload.status ?? row.status,
      assignee_id: Object.hasOwn(payload, "assigneeId")
        ? (payload.assigneeId ?? null)
        : row.assignee_id,
    };
    const closedAt =
      next.status === "done"
        ? (row.closed_at ?? new Date().toISOString())
        : null;
    const updated = await client.query(
      "update public.tickets set title=$1, description=$2, priority=$3, assignee_id=$4, status=$5, closed_at=$6, version=version+1 where id=$7 returning *",
      [
        next.title,
        next.description,
        next.priority,
        next.assignee_id,
        next.status,
        closedAt,
        ticketId,
      ],
    );
    for (const item of [
      ["title", row.title, next.title],
      ["description", row.description, next.description],
      ["priority", row.priority, next.priority],
      ["assignee_id", row.assignee_id, next.assignee_id],
      ["status", row.status, next.status],
    ] as const)
      if (item[1] !== item[2])
        await writeAudit(
          client,
          user.id,
          ticketId,
          item[0] === "assignee_id"
            ? "assignee_changed"
            : item[0] === "status"
              ? "status_changed"
              : `${item[0]}_changed`,
          item[0],
          item[1],
          item[2],
        );
    if (payload.labelIds)
      await replaceLabels(client, ticketId, payload.labelIds);
    await client.query("commit");
    return presentTicket(updated.rows[0]);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
};
export const changeStatus = async (
  user: CurrentUser,
  ticketId: string,
  payload: ChangeStatus,
) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const row = await getTicketOrThrow(ticketId, user, client);
    if (!canMove(user, row))
      throw new HttpError(403, {
        code: "FORBIDDEN",
        message: "No tienes permisos para cambiar estado.",
      });
    if (row.archived_at)
      throw new HttpError(422, {
        code: "ARCHIVED",
        message: "El ticket esta archivado.",
      });
    await assertVersion(row, payload.version);
    const pos = await client.query(
      "select coalesce(max(position),-1)+1 as p from public.tickets where status=$1 and archived_at is null",
      [payload.status],
    );
    const closedAt =
      payload.status === "done" ? new Date().toISOString() : null;
    const updated = await client.query(
      "update public.tickets set status=$1, position=$2, closed_at=$3, version=version+1 where id=$4 returning *",
      [payload.status, pos.rows[0].p, closedAt, ticketId],
    );
    await writeAudit(
      client,
      user.id,
      ticketId,
      "status_changed",
      "status",
      row.status,
      payload.status,
    );
    await client.query("commit");
    return presentTicket(updated.rows[0]);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
};
export const changePosition = async (
  user: CurrentUser,
  ticketId: string,
  payload: ChangePosition,
) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const row = await getTicketOrThrow(ticketId, user, client);
    if (!canMove(user, row))
      throw new HttpError(403, {
        code: "FORBIDDEN",
        message: "No tienes permisos para mover este ticket.",
      });
    if (row.archived_at)
      throw new HttpError(422, {
        code: "ARCHIVED",
        message: "El ticket esta archivado.",
      });
    await assertVersion(row, payload.version);
    const closedAt =
      payload.status === "done" ? new Date().toISOString() : null;
    const updated = await client.query(
      "update public.tickets set status=$1, position=$2, closed_at=$3, version=version+1 where id=$4 returning *",
      [payload.status, payload.position, closedAt, ticketId],
    );
    await writeAudit(
      client,
      user.id,
      ticketId,
      row.status === payload.status ? "ticket_reordered" : "status_changed",
      row.status === payload.status ? "position" : "status",
      row.status === payload.status ? row.position : row.status,
      row.status === payload.status ? payload.position : payload.status,
    );
    await client.query("commit");
    return presentTicket(updated.rows[0]);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
};
export const archiveTicket = async (
  user: CurrentUser,
  ticketId: string,
  version: number,
) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const row = await getTicketOrThrow(ticketId, user, client);
    if (!canEdit(user, row))
      throw new HttpError(403, {
        code: "FORBIDDEN",
        message: "No puedes archivar este ticket.",
      });
    await assertVersion(row, version);
    const updated = await client.query(
      "update public.tickets set archived_at=now(), version=version+1 where id=$1 returning *",
      [ticketId],
    );
    await writeAudit(
      client,
      user.id,
      ticketId,
      "ticket_archived",
      "archived_at",
      row.archived_at,
      "now",
    );
    await client.query("commit");
    return presentTicket(updated.rows[0]);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
};
export const restoreTicket = async (
  user: CurrentUser,
  ticketId: string,
  version: number,
) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    if (user.role !== "admin")
      throw new HttpError(403, {
        code: "FORBIDDEN",
        message: "Solo admin puede restaurar tickets.",
      });
    const row = await getTicketOrThrow(ticketId, user, client);
    await assertVersion(row, version);
    const updated = await client.query(
      "update public.tickets set archived_at=null, version=version+1 where id=$1 returning *",
      [ticketId],
    );
    await writeAudit(
      client,
      user.id,
      ticketId,
      "ticket_restored",
      "archived_at",
      row.archived_at,
      null,
    );
    await client.query("commit");
    return presentTicket(updated.rows[0]);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
};
