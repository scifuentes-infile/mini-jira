import type { Priority, TicketStatus } from "../types/domain";

export const ticketStatuses: TicketStatus[] = [
  "todo",
  "in_progress",
  "review",
  "blocked",
  "done",
];

export const statusLabels: Record<TicketStatus, string> = {
  todo: "Por hacer",
  in_progress: "En progreso",
  review: "En revisión",
  blocked: "Bloqueado",
  done: "Finalizado",
};

export const priorityLabels: Record<Priority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const statusClasses: Record<TicketStatus, string> = {
  todo: "bg-status-todo text-on-surface",
  in_progress: "bg-status-in-progress text-on-surface",
  review: "bg-status-review text-on-primary",
  blocked: "bg-status-blocked text-on-primary",
  done: "bg-status-done text-on-surface",
};

export const priorityClasses: Record<Priority, string> = {
  high: "text-priority-high",
  medium: "text-priority-medium",
  low: "text-priority-low",
};
