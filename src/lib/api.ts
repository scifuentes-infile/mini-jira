import type {
  Label,
  Ticket,
  TicketFilters,
  TicketInput,
  TicketStatus,
  User,
} from "../types/domain";
import { ApiError } from "../types/domain";

const API_BASE_URL = "/api/v1";

type ApiEnvelope<T> =
  | { data: T; error: null }
  | {
      data: null;
      error: {
        code: string;
        message: string;
        details?: { currentTicket?: Ticket };
      };
    };

type ListResponse<T> = {
  items: T[];
};

type TicketListResponse = ListResponse<Ticket> & {
  total: number;
  limit: number;
  offset: number;
};

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

function buildUrl(path: string, params?: Record<string, unknown>) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return `${url.pathname}${url.search}`;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  let envelope: ApiEnvelope<T> | null = null;

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      response.status || 503,
      "NETWORK_ERROR",
      "No fue posible conectar con el backend.",
    );
  }

  if (!response.ok || envelope.error) {
    const error = envelope.error ?? {
      code: "INTERNAL_ERROR",
      message: "Respuesta inválida del servidor.",
    };

    throw new ApiError(
      response.status,
      error.code,
      error.message,
      error.details?.currentTicket,
    );
  }

  return envelope.data;
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    const data = await request<{ user: User }>(buildUrl("/auth/login"), {
      method: "POST",
      body: { email, password },
    });
    return data.user;
  },

  async logout(): Promise<void> {
    await request<void>(buildUrl("/auth/logout"), { method: "POST" });
  },

  async me(): Promise<User | null> {
    const data = await request<{ user: User | null }>(buildUrl("/auth/me"));
    return data.user;
  },

  async listUsers(): Promise<User[]> {
    const data = await request<ListResponse<User>>(buildUrl("/users"));
    return data.items;
  },

  async listLabels(): Promise<Label[]> {
    const data = await request<ListResponse<Label>>(buildUrl("/labels"));
    return data.items;
  },

  async listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
    const data = await request<TicketListResponse>(
      buildUrl("/tickets", { limit: 100, offset: 0, ...filters }),
    );
    return data.items;
  },

  async getTicket(id: string): Promise<Ticket> {
    const data = await request<{ ticket: Ticket }>(
      buildUrl(`/tickets/${encodeURIComponent(id)}`),
    );
    return data.ticket;
  },

  async createTicket(input: TicketInput): Promise<Ticket> {
    const data = await request<{ ticket: Ticket }>(buildUrl("/tickets"), {
      method: "POST",
      body: input,
    });
    return data.ticket;
  },

  async updateTicket(
    id: string,
    input: TicketInput & { version: number },
  ): Promise<Ticket> {
    const data = await request<{ ticket: Ticket }>(
      buildUrl(`/tickets/${encodeURIComponent(id)}`),
      {
        method: "PUT",
        body: input,
      },
    );
    return data.ticket;
  },

  async changeStatus(
    id: string,
    status: TicketStatus,
    version: number,
  ): Promise<Ticket> {
    const data = await request<{ ticket: Ticket }>(
      buildUrl(`/tickets/${encodeURIComponent(id)}/status`),
      {
        method: "PATCH",
        body: { status, version },
      },
    );
    return data.ticket;
  },

  async reorderTicket(
    id: string,
    status: TicketStatus,
    position: number,
    version: number,
  ): Promise<Ticket> {
    const data = await request<{ ticket: Ticket }>(
      buildUrl(`/tickets/${encodeURIComponent(id)}/position`),
      {
        method: "PATCH",
        body: { status, position, version },
      },
    );
    return data.ticket;
  },

  async archiveTicket(id: string, version: number): Promise<Ticket> {
    const data = await request<{ ticket: Ticket }>(
      buildUrl(`/tickets/${encodeURIComponent(id)}/archive`),
      {
        method: "POST",
        body: { version },
      },
    );
    return data.ticket;
  },

  async restoreTicket(id: string, version: number): Promise<Ticket> {
    const data = await request<{ ticket: Ticket }>(
      buildUrl(`/tickets/${encodeURIComponent(id)}/restore`),
      {
        method: "POST",
        body: { version },
      },
    );
    return data.ticket;
  },
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
