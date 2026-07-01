import type { ReactNode } from "react";
import type {
  Label,
  Priority,
  TicketStatus,
  UserSummary,
} from "../../types/domain";

export type KanbanId = string;

export interface KanbanTask {
  id: KanbanId;
  key: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  position: number;
  labels: Label[];
  assignee: UserSummary | null;
  version: number;
}

export interface KanbanStatusDefinition {
  id: TicketStatus;
  label: string;
  emptyMessage: string;
}

export interface KanbanMoveInput {
  task: KanbanTask;
  sourceStatus: TicketStatus;
  destinationStatus: TicketStatus;
  destinationIndex: number;
}

export interface TaskRenderOptions {
  draggable: boolean;
  onStatusChange: (status: TicketStatus) => void;
}

export type KanbanTaskRenderer = (
  task: KanbanTask,
  options: TaskRenderOptions,
) => ReactNode;
