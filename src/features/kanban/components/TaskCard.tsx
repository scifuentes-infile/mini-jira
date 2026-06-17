import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../../../components/ui/Avatar";
import { PriorityIcon } from "../../../components/ui/PriorityIcon";
import {
  priorityLabels,
  statusLabels,
  ticketStatuses,
} from "../../../lib/constants";
import type { TicketStatus } from "../../../types/domain";
import type { KanbanTask } from "../types";

export interface TaskCardProps {
  task: KanbanTask;
  draggable?: boolean;
  selected?: boolean;
  compact?: boolean;
  href?: string;
  onOpen?: (task: KanbanTask) => void;
  onStatusChange?: (task: KanbanTask, status: TicketStatus) => void;
}

export function TaskCard({
  task,
  draggable = true,
  selected = false,
  compact = false,
  href,
  onOpen,
  onStatusChange,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task, status: task.status },
    disabled: !draggable,
  });

  const title = href ? (
    <Link
      to={href}
      className="line-clamp-2 text-headline-sm text-on-surface hover:text-primary"
      onClick={(event) => {
        if (isDragging) event.preventDefault();
        onOpen?.(task);
      }}
    >
      {task.title}
    </Link>
  ) : (
    <button
      type="button"
      className="line-clamp-2 text-left text-headline-sm text-on-surface hover:text-primary"
      onClick={() => onOpen?.(task)}
    >
      {task.title}
    </button>
  );

  return (
    <article
      data-testid={`task-card-${task.id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`touch-none rounded-lg border bg-surface-container-lowest transition-colors ${
        compact ? "p-3" : "p-4"
      } ${
        isDragging || selected
          ? "border-primary"
          : "border-outline-variant hover:border-primary-container"
      } ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      {...listeners}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2" aria-hidden="true">
          <PriorityIcon priority={task.priority} />
          {draggable ? (
            <GripVertical className="text-outline" size={16} />
          ) : null}
        </span>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-label-sm uppercase text-on-surface-variant hover:bg-surface-container-high"
          aria-label={`${priorityLabels[task.priority]}. Mover ${task.key}: ${task.title}`}
          onKeyDown={(event) => listeners?.onKeyDown?.(event)}
          {...attributes}
        >
          {task.key}
        </button>
      </div>
      {title}
      {!compact ? (
        <>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 2).map((label) => (
                <span
                  key={label.id}
                  className="rounded-md bg-secondary-container px-2 py-1 text-label-sm text-on-secondary-container"
                >
                  {label.name}
                </span>
              ))}
            </div>
            {task.assignee ? (
              <Avatar user={task.assignee} size="sm" />
            ) : (
              <span
                className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-outline text-outline"
                title="Sin asignar"
              >
                <UserRound size={15} />
              </span>
            )}
          </div>
          {draggable && onStatusChange ? (
            <label
              className="mt-4 grid gap-1 border-t border-outline-variant pt-3 text-label-sm text-on-surface-variant md:hidden"
              onPointerDown={(event) => event.stopPropagation()}
            >
              Cambiar estado
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface"
                value={task.status}
                onChange={(event) =>
                  onStatusChange(task, event.target.value as TicketStatus)
                }
              >
                {ticketStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
