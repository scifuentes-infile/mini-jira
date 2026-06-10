import { differenceInCalendarDays, format, subMonths } from "date-fns";
import { auditLogs, comments, labels, tickets, users } from "./database";
import type {
  ApiError as ApiErrorType,
  Comment,
  DashboardData,
  Ticket,
  TicketFilters,
  TicketInput,
  TicketStatus,
  User,
} from "../types/domain";
import { ApiError } from "../types/domain";
import { ticketStatuses } from "../lib/constants";

let currentUserId: string | null = null;
const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => structuredClone(value);
const now = () => new Date().toISOString();
const userSummary = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    status: user.status,
    avatarUrl: user.avatarUrl,
  };
};

function currentUser(): User {
  const user = users.find((item) => item.id === currentUserId);
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sesión no válida.");
  return user;
}

function ticketById(id: string): Ticket {
  const ticket = tickets.find((item) => item.id === id);
  if (!ticket) throw new ApiError(404, "NOT_FOUND", "Ticket no encontrado.");
  return ticket;
}

function canViewTicket(ticket: Ticket, actor: User): boolean {
  return (
    !ticket.archivedAt ||
    actor.role === "admin" ||
    ticket.creator.id === actor.id ||
    ticket.assignee?.id === actor.id
  );
}

function normalizePositions(status: TicketStatus) {
  tickets
    .filter((item) => !item.archivedAt && item.status === status)
    .sort((a, b) => a.position - b.position)
    .forEach((item, index) => {
      item.position = index;
    });
}

function ensureVersion(ticket: Ticket, version: number) {
  if (ticket.version !== version) {
    throw new ApiError(
      409,
      "VERSION_CONFLICT",
      "El ticket fue modificado por otra persona.",
      clone(ticket),
    );
  }
}

function addAudit(
  ticket: Ticket,
  action: string,
  field: string | null,
  oldValue: string | null,
  newValue: string | null,
) {
  auditLogs.push({
    id: crypto.randomUUID(),
    ticketId: ticket.id,
    actor: userSummary(currentUser()),
    action,
    field,
    oldValue,
    newValue,
    createdAt: now(),
  });
}

export const mockApi = {
  async login(email: string, password: string): Promise<User> {
    await wait();
    const user = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user || password !== "demo123" || user.status !== "active") {
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Correo o contraseña incorrectos.",
      );
    }
    currentUserId = user.id;
    return clone(user);
  },

  async logout(): Promise<void> {
    await wait(100);
    currentUserId = null;
  },

  async me(): Promise<User | null> {
    await wait(100);
    return currentUserId
      ? clone(users.find((item) => item.id === currentUserId) ?? null)
      : null;
  },

  async listUsers(): Promise<User[]> {
    await wait();
    currentUser();
    return clone(users);
  },

  async updateUser(
    id: string,
    patch: Partial<Pick<User, "name" | "email" | "role" | "status">>,
  ): Promise<User> {
    await wait();
    const actor = currentUser();
    if (actor.role !== "admin") {
      throw new ApiError(403, "FORBIDDEN", "No tienes permiso.");
    }
    const user = users.find((item) => item.id === id);
    if (!user) throw new ApiError(404, "NOT_FOUND", "Usuario no encontrado.");
    if (patch.status === "inactive" && user.role === "admin") {
      const activeAdmins = users.filter(
        (item) => item.role === "admin" && item.status === "active",
      );
      if (activeAdmins.length === 1 && activeAdmins[0]?.id === user.id) {
        throw new ApiError(
          422,
          "LAST_ADMIN",
          "No puedes desactivar al último administrador.",
        );
      }
    }
    Object.assign(user, patch, { updatedAt: now() });
    return clone(user);
  },

  async listLabels() {
    await wait(100);
    currentUser();
    return clone(labels);
  },

  async listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
    await wait();
    const actor = currentUser();
    const result = tickets
      .filter((ticket) => canViewTicket(ticket, actor))
      .filter((ticket) =>
        filters.archived ? Boolean(ticket.archivedAt) : !ticket.archivedAt,
      )
      .filter(
        (ticket) =>
          !filters.search ||
          ticket.title.toLowerCase().includes(filters.search.toLowerCase()),
      )
      .filter((ticket) => !filters.status || ticket.status === filters.status)
      .filter(
        (ticket) => !filters.priority || ticket.priority === filters.priority,
      )
      .filter(
        (ticket) =>
          !filters.assigneeId || ticket.assignee?.id === filters.assigneeId,
      )
      .filter(
        (ticket) =>
          !filters.creatorId || ticket.creator.id === filters.creatorId,
      )
      .filter(
        (ticket) =>
          !filters.labelId ||
          ticket.labels.some((label) => label.id === filters.labelId),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    return clone(result);
  },

  async getTicket(id: string): Promise<Ticket> {
    await wait();
    const actor = currentUser();
    const ticket = ticketById(id);
    if (!canViewTicket(ticket, actor)) {
      throw new ApiError(404, "NOT_FOUND", "Ticket no encontrado.");
    }
    return clone(ticket);
  },

  async createTicket(input: TicketInput): Promise<Ticket> {
    await wait();
    const actor = currentUser();
    const assignee = input.assigneeId
      ? (users.find(
          (item) => item.id === input.assigneeId && item.status === "active",
        ) ?? null)
      : null;
    const createdAt = now();
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      key: `MJ-${String(tickets.length + 1).padStart(3, "0")}`,
      title: input.title,
      description: input.description,
      status: "todo",
      priority: input.priority,
      labels: labels.filter((label) => input.labelIds.includes(label.id)),
      creator: userSummary(actor),
      assignee: assignee ? userSummary(assignee) : null,
      createdAt,
      updatedAt: createdAt,
      closedAt: null,
      archivedAt: null,
      position: tickets.filter(
        (item) => !item.archivedAt && item.status === "todo",
      ).length,
      version: 1,
    };
    tickets.push(ticket);
    addAudit(ticket, "ticket_created", null, null, "todo");
    return clone(ticket);
  },

  async updateTicket(
    id: string,
    input: TicketInput & { version: number },
  ): Promise<Ticket> {
    await wait();
    const actor = currentUser();
    const ticket = ticketById(id);
    if (ticket.archivedAt) {
      throw new ApiError(422, "ARCHIVED", "El ticket está archivado.");
    }
    if (actor.role !== "admin" && ticket.creator.id !== actor.id) {
      throw new ApiError(403, "FORBIDDEN", "No puedes editar este ticket.");
    }
    ensureVersion(ticket, input.version);
    const previous = clone(ticket);
    const assignee = input.assigneeId
      ? (users.find(
          (item) => item.id === input.assigneeId && item.status === "active",
        ) ?? null)
      : null;
    Object.assign(ticket, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      labels: labels.filter((label) => input.labelIds.includes(label.id)),
      assignee: assignee ? userSummary(assignee) : null,
      updatedAt: now(),
      version: ticket.version + 1,
    });
    (["title", "description", "priority"] as const).forEach((field) => {
      if (previous[field] !== ticket[field]) {
        addAudit(
          ticket,
          `${field}_changed`,
          field,
          previous[field],
          ticket[field],
        );
      }
    });
    if (previous.assignee?.id !== ticket.assignee?.id) {
      addAudit(
        ticket,
        "assignee_changed",
        "assignee",
        previous.assignee?.name ?? "Sin asignar",
        ticket.assignee?.name ?? "Sin asignar",
      );
    }
    return clone(ticket);
  },

  async changeStatus(
    id: string,
    status: TicketStatus,
    version: number,
  ): Promise<Ticket> {
    await wait();
    const actor = currentUser();
    const ticket = ticketById(id);
    if (ticket.archivedAt) {
      throw new ApiError(422, "ARCHIVED", "El ticket está archivado.");
    }
    if (actor.role !== "admin" && ticket.assignee?.id !== actor.id) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Solo el responsable puede cambiar el estado.",
      );
    }
    ensureVersion(ticket, version);
    const previous = ticket.status;
    if (previous === status) return clone(ticket);
    ticket.status = status;
    ticket.position = tickets.filter(
      (item) =>
        !item.archivedAt && item.id !== ticket.id && item.status === status,
    ).length;
    ticket.closedAt = status === "done" ? now() : null;
    ticket.updatedAt = now();
    ticket.version += 1;
    normalizePositions(previous);
    addAudit(ticket, "status_changed", "status", previous, status);
    return clone(ticket);
  },

  async reorderTicket(
    id: string,
    status: TicketStatus,
    position: number,
    version: number,
  ): Promise<Ticket> {
    await wait();
    const actor = currentUser();
    const ticket = ticketById(id);
    if (ticket.archivedAt) {
      throw new ApiError(422, "ARCHIVED", "El ticket está archivado.");
    }
    if (actor.role !== "admin" && ticket.assignee?.id !== actor.id) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Solo el responsable puede mover el ticket.",
      );
    }
    ensureVersion(ticket, version);

    const previousStatus = ticket.status;
    const previousPosition = ticket.position;
    const source = tickets
      .filter(
        (item) =>
          !item.archivedAt &&
          item.id !== ticket.id &&
          item.status === previousStatus,
      )
      .sort((a, b) => a.position - b.position);
    const target =
      previousStatus === status
        ? source
        : tickets
            .filter(
              (item) =>
                !item.archivedAt &&
                item.id !== ticket.id &&
                item.status === status,
            )
            .sort((a, b) => a.position - b.position);

    if (previousStatus !== status) {
      source.forEach((item, index) => {
        item.position = index;
      });
    }
    const boundedPosition = Math.max(0, Math.min(position, target.length));
    target.splice(boundedPosition, 0, ticket);
    target.forEach((item, index) => {
      item.position = index;
    });

    ticket.status = status;
    ticket.closedAt = status === "done" ? now() : null;
    ticket.updatedAt = now();
    ticket.version += 1;
    addAudit(
      ticket,
      previousStatus === status ? "ticket_reordered" : "status_changed",
      previousStatus === status ? "position" : "status",
      previousStatus === status ? String(previousPosition) : previousStatus,
      previousStatus === status ? String(boundedPosition) : status,
    );
    return clone(ticket);
  },

  async archiveTicket(id: string, version: number): Promise<Ticket> {
    await wait();
    const actor = currentUser();
    const ticket = ticketById(id);
    if (actor.role !== "admin" && ticket.creator.id !== actor.id) {
      throw new ApiError(403, "FORBIDDEN", "No puedes archivar este ticket.");
    }
    ensureVersion(ticket, version);
    ticket.archivedAt = now();
    ticket.updatedAt = now();
    ticket.version += 1;
    normalizePositions(ticket.status);
    addAudit(ticket, "ticket_archived", "archivedAt", null, ticket.archivedAt);
    return clone(ticket);
  },

  async restoreTicket(id: string, version: number): Promise<Ticket> {
    await wait();
    const actor = currentUser();
    if (actor.role !== "admin") {
      throw new ApiError(403, "FORBIDDEN", "Solo un administrador restaura.");
    }
    const ticket = ticketById(id);
    ensureVersion(ticket, version);
    const archivedAt = ticket.archivedAt;
    ticket.archivedAt = null;
    ticket.updatedAt = now();
    ticket.version += 1;
    addAudit(ticket, "ticket_restored", "archivedAt", archivedAt, null);
    return clone(ticket);
  },

  async listComments(ticketId: string): Promise<Comment[]> {
    await wait(150);
    currentUser();
    ticketById(ticketId);
    return clone(
      comments
        .filter((comment) => comment.ticketId === ticketId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
            a.id.localeCompare(b.id),
        ),
    );
  },

  async addComment(ticketId: string, body: string): Promise<Comment> {
    await wait();
    const actor = currentUser();
    const ticket = ticketById(ticketId);
    if (ticket.archivedAt) {
      throw new ApiError(
        422,
        "ARCHIVED",
        "El ticket archivado no admite comentarios.",
      );
    }
    const createdAt = now();
    const comment: Comment = {
      id: crypto.randomUUID(),
      ticketId,
      author: userSummary(actor),
      body,
      createdAt,
      updatedAt: createdAt,
    };
    comments.push(comment);
    return clone(comment);
  },

  async listAudit(ticketId: string) {
    await wait(150);
    currentUser();
    ticketById(ticketId);
    return clone(
      auditLogs
        .filter((log) => log.ticketId === ticketId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    );
  },

  async dashboard(): Promise<DashboardData> {
    await wait();
    const actor = currentUser();
    const visible = tickets.filter(
      (ticket) =>
        !ticket.archivedAt &&
        (actor.role === "admin" ||
          ticket.creator.id === actor.id ||
          ticket.assignee?.id === actor.id),
    );
    const byStatus = Object.fromEntries(
      ticketStatuses.map((status) => [
        status,
        visible.filter((ticket) => ticket.status === status).length,
      ]),
    ) as Record<TicketStatus, number>;
    const closed = visible.filter(
      (ticket) => ticket.status === "done" && ticket.closedAt,
    );
    const months = Array.from({ length: 12 }, (_, index) =>
      subMonths(new Date(), 11 - index),
    );
    const closedByMonth = months.map((month) => {
      const key = format(month, "yyyy-MM");
      return {
        month: format(month, "MMM"),
        total: closed.filter(
          (ticket) =>
            ticket.closedAt &&
            format(new Date(ticket.closedAt), "yyyy-MM") === key,
        ).length,
      };
    });
    const assignees = new Map<string, number>();
    visible
      .filter((ticket) => ticket.status !== "done")
      .forEach((ticket) => {
        const name = ticket.assignee?.name ?? "Sin asignar";
        assignees.set(name, (assignees.get(name) ?? 0) + 1);
      });
    const totalDays = closed.reduce(
      (total, ticket) =>
        total +
        differenceInCalendarDays(
          new Date(ticket.closedAt!),
          new Date(ticket.createdAt),
        ),
      0,
    );
    return {
      byStatus,
      blocked: byStatus.blocked,
      averageCloseDays: closed.length
        ? Math.round((totalDays / closed.length) * 10) / 10
        : 0,
      closedByMonth,
      activeByAssignee: Array.from(assignees, ([name, total]) => ({
        name,
        total,
      })),
    };
  },
};

export function isApiError(error: unknown): error is ApiErrorType {
  return error instanceof ApiError;
}
