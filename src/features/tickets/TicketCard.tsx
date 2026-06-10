import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { PriorityIcon } from "../../components/ui/PriorityIcon";
import {
  priorityLabels,
  statusLabels,
  ticketStatuses,
} from "../../lib/constants";
import type { Ticket, TicketStatus } from "../../types/domain";

export function TicketCard({
  ticket,
  draggable,
  onMobileStatusChange,
}: {
  ticket: Ticket;
  draggable: boolean;
  onMobileStatusChange?: (status: TicketStatus) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket.id,
    data: { type: "ticket", ticket },
    disabled: !draggable,
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-surface-container-lowest p-4 transition-colors ${
        isDragging
          ? "border-primary"
          : "border-outline-variant hover:border-primary-container"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="grid h-10 w-10 touch-none place-items-center rounded-md hover:bg-surface-container-high disabled:cursor-default"
          aria-label={`${priorityLabels[ticket.priority]}. Mover ${ticket.key}: ${ticket.title}`}
          disabled={!draggable}
          {...listeners}
          {...attributes}
        >
          {draggable ? (
            <span className="flex items-center gap-1">
              <PriorityIcon priority={ticket.priority} />
              <GripVertical
                className="text-outline"
                size={15}
                aria-hidden="true"
              />
            </span>
          ) : (
            <PriorityIcon priority={ticket.priority} />
          )}
        </button>
        <span className="text-label-sm uppercase text-on-surface-variant">
          {ticket.key}
        </span>
      </div>
      <Link
        to={`/tickets/${ticket.id}`}
        className="line-clamp-2 text-headline-sm text-on-surface hover:text-primary"
      >
        {ticket.title}
      </Link>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {ticket.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="rounded-md bg-secondary-container px-2 py-1 text-label-sm text-on-secondary-container"
            >
              {label.name}
            </span>
          ))}
        </div>
        {ticket.assignee ? (
          <Avatar user={ticket.assignee} size="sm" />
        ) : (
          <span
            className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-outline text-outline"
            title="Sin asignar"
          >
            <UserRound size={15} />
          </span>
        )}
      </div>
      {draggable && onMobileStatusChange ? (
        <label className="mt-4 grid gap-1 border-t border-outline-variant pt-3 text-label-sm text-on-surface-variant md:hidden">
          Cambiar estado
          <select
            className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface"
            value={ticket.status}
            onChange={(event) =>
              onMobileStatusChange(event.target.value as TicketStatus)
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
    </article>
  );
}
