import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type {
  TicketFilters,
  TicketInput,
  TicketStatus,
} from "../../types/domain";

export const ticketKeys = {
  all: ["tickets"] as const,
  list: (filters: TicketFilters) => ["tickets", "list", filters] as const,
  detail: (id: string) => ["tickets", "detail", id] as const,
};

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => api.listTickets(filters),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => api.getTicket(id),
  });
}

export function useCreateTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TicketInput) => api.createTicket(input),
    onSuccess: () => client.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useUpdateTicket(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TicketInput & { version: number }) =>
      api.updateTicket(id, input),
    onSuccess: (ticket) => {
      client.setQueryData(ticketKeys.detail(id), ticket);
      void client.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

export function useChangeStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      version,
    }: {
      id: string;
      status: TicketStatus;
      version: number;
    }) => api.changeStatus(id, status, version),
    onSuccess: (ticket) => {
      client.setQueryData(ticketKeys.detail(ticket.id), ticket);
      void client.invalidateQueries({ queryKey: ticketKeys.all });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useReorderTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      position,
      version,
    }: {
      id: string;
      status: TicketStatus;
      position: number;
      version: number;
    }) => api.reorderTicket(id, status, position, version),
    onSuccess: (ticket) => {
      client.setQueryData(ticketKeys.detail(ticket.id), ticket);
      void client.invalidateQueries({ queryKey: ticketKeys.all });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useArchiveTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      api.archiveTicket(id, version),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ticketKeys.all });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRestoreTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      api.restoreTicket(id, version),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ticketKeys.all });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
