export type Role = "admin" | "user";
export type UserStatus = "active" | "inactive";
export type TicketStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "blocked"
  | "done";
export type Priority = "low" | "medium" | "high";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserSummary = Pick<
  User,
  "id" | "username" | "name" | "email" | "avatarUrl" | "status"
>;

export interface Label {
  id: string;
  name: string;
  color:
    | "secondary-container"
    | "primary-fixed"
    | "tertiary-fixed"
    | "surface-container-highest";
}

export interface Ticket {
  id: string;
  key: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  labels: Label[];
  creator: UserSummary;
  assignee: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  archivedAt: string | null;
  position: number;
  version: number;
}

export interface Comment {
  id: string;
  ticketId: string;
  author: UserSummary;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  ticketId: string;
  actor: UserSummary;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface TicketInput {
  title: string;
  description: string;
  priority: Priority;
  assigneeId: string | null;
  labelIds: string[];
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus;
  priority?: Priority;
  assigneeId?: string;
  creatorId?: string;
  labelId?: string;
  archived?: boolean;
}

export interface DashboardData {
  byStatus: Record<TicketStatus, number>;
  blocked: number;
  averageCloseDays: number;
  closedByMonth: Array<{ month: string; total: number }>;
  activeByAssignee: Array<{ name: string; total: number }>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public currentTicket?: Ticket,
  ) {
    super(message);
  }
}
