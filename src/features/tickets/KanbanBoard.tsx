import {
  closestCorners,
  pointerWithin,
  rectIntersection,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { statusLabels, ticketStatuses } from "../../lib/constants";
import type { Ticket, TicketStatus } from "../../types/domain";
import { TicketCard } from "./TicketCard";

const VIRTUALIZATION_THRESHOLD = 20;

interface KanbanBoardProps {
  tickets: Ticket[];
  canDrag: (ticket: Ticket) => boolean;
  onMove: (
    ticket: Ticket,
    status: TicketStatus,
    position: number,
  ) => Promise<void>;
}

function groupTickets(tickets: Ticket[]) {
  return Object.fromEntries(
    ticketStatuses.map((status) => [
      status,
      tickets
        .filter((ticket) => ticket.status === status)
        .sort((a, b) => a.position - b.position),
    ]),
  ) as Record<TicketStatus, Ticket[]>;
}

function BoardColumn({
  status,
  tickets,
  canDrag,
  mobileStatus,
  onMobileMove,
}: {
  status: TicketStatus;
  tickets: Ticket[];
  canDrag: (ticket: Ticket) => boolean;
  mobileStatus: TicketStatus;
  onMobileMove: (ticket: Ticket, status: TicketStatus) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });
  // TanStack Virtual intentionally exposes mutable measurement functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: tickets.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 172,
    overscan: 4,
    enabled: tickets.length > VIRTUALIZATION_THRESHOLD,
  });
  const virtualized = tickets.length > VIRTUALIZATION_THRESHOLD;

  const card = (ticket: Ticket) => (
    <TicketCard
      ticket={ticket}
      draggable={canDrag(ticket)}
      onMobileStatusChange={(nextStatus) => onMobileMove(ticket, nextStatus)}
    />
  );

  return (
    <section
      className={`${mobileStatus === status ? "block" : "hidden"} w-full shrink-0 md:block md:w-80`}
    >
      <header className="mb-3 flex items-center justify-between px-2">
        <h2 className="text-label-md uppercase text-on-surface-variant">
          {statusLabels[status]}
        </h2>
        <StatusBadge status={status} count={tickets.length} />
      </header>
      <SortableContext
        items={tickets.map((ticket) => ticket.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          data-testid={`kanban-column-${status}`}
          ref={(node) => {
            scrollRef.current = node;
            setDroppableRef(node);
          }}
          className={`min-h-[500px] max-h-[640px] overflow-y-auto rounded-xl border p-3 ${
            isOver
              ? "border-primary bg-primary-fixed"
              : "border-outline-variant bg-surface-container-low"
          }`}
        >
          {virtualized ? (
            <div
              className="relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const ticket = tickets[virtualRow.index];
                if (!ticket) return null;
                return (
                  <div
                    key={ticket.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="absolute left-0 top-0 w-full pb-3"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {card(ticket)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid content-start gap-3">
              {tickets.map((ticket) => (
                <div key={ticket.id}>{card(ticket)}</div>
              ))}
            </div>
          )}
          {!tickets.length ? (
            <p className="p-8 text-center text-body-md text-on-surface-variant">
              No hay tickets en este estado.
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  const intersections = rectIntersection(args);
  if (intersections.length > 0) return intersections;
  return closestCorners(args);
};

export function KanbanBoard({ tickets, canDrag, onMove }: KanbanBoardProps) {
  const [orderedTickets, setOrderedTickets] = useState(tickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [mobileStatus, setMobileStatus] = useState<TicketStatus>("todo");
  const lastOverId = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Synchronize the optimistic board when the remote query publishes new data.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrderedTickets(tickets), [tickets]);
  const grouped = useMemo(() => groupTickets(orderedTickets), [orderedTickets]);
  const findTicket = (id: string) =>
    orderedTickets.find((ticket) => ticket.id === id);

  function destination(overIdValue: string | number | null | undefined) {
    if (overIdValue === null || overIdValue === undefined) return null;
    const overId = String(overIdValue);
    if (ticketStatuses.includes(overId as TicketStatus)) {
      const status = overId as TicketStatus;
      return { status, position: grouped[status].length };
    }
    const overTicket = findTicket(overId);
    if (!overTicket) return null;
    return {
      status: overTicket.status,
      position: grouped[overTicket.status].findIndex(
        (ticket) => ticket.id === overTicket.id,
      ),
    };
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.over) lastOverId.current = String(event.over.id);
  }

  async function moveTicket(
    ticket: Ticket,
    status: TicketStatus,
    position: number,
  ) {
    if (ticket.status === status && ticket.position === position) return;
    const previous = orderedTickets;
    const sourceTickets = previous
      .filter((item) => item.id !== ticket.id && item.status === ticket.status)
      .sort((a, b) => a.position - b.position);
    const targetTickets =
      ticket.status === status
        ? sourceTickets
        : previous
            .filter((item) => item.id !== ticket.id && item.status === status)
            .sort((a, b) => a.position - b.position);
    targetTickets.splice(position, 0, { ...ticket, status, position });
    const changedIds = new Set(targetTickets.map((item) => item.id));
    const next = previous
      .filter((item) => !changedIds.has(item.id) && item.id !== ticket.id)
      .concat(
        targetTickets.map((item, index) => ({ ...item, position: index })),
      )
      .map((item) => {
        if (ticket.status === status || item.status !== ticket.status)
          return item;
        const sourceIndex = sourceTickets.findIndex(
          (source) => source.id === item.id,
        );
        return sourceIndex >= 0 ? { ...item, position: sourceIndex } : item;
      });
    setOrderedTickets(next);
    try {
      await onMove(ticket, status, position);
      setMobileStatus(status);
    } catch {
      setOrderedTickets(previous);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTicket(null);
    const ticket = findTicket(String(event.active.id));
    const target = destination(event.over?.id ?? lastOverId.current);
    if (ticket && target)
      await moveTicket(ticket, target.status, target.position);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
      onDragStart={(event: DragStartEvent) => {
        lastOverId.current = null;
        setActiveTicket(findTicket(String(event.active.id)) ?? null);
      }}
      onDragOver={handleDragOver}
      onDragCancel={() => {
        lastOverId.current = null;
        setActiveTicket(null);
      }}
      onDragEnd={(event) => void handleDragEnd(event)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Pulsa espacio para tomar el ticket. Usa las flechas para moverlo, espacio para soltarlo y escape para cancelar.",
        },
        announcements: {
          onDragStart({ active }) {
            const ticket = findTicket(String(active.id));
            return ticket
              ? `Has tomado ${ticket.key}, ${ticket.title}.`
              : "Has tomado un ticket.";
          },
          onDragOver({ over }) {
            if (!over) return "Fuera de una zona válida.";
            const id = String(over.id);
            return ticketStatuses.includes(id as TicketStatus)
              ? `Sobre la columna ${statusLabels[id as TicketStatus]}.`
              : "Sobre otro ticket.";
          },
          onDragEnd({ over }) {
            return over ? "Movimiento finalizado." : "Movimiento cancelado.";
          },
          onDragCancel() {
            return "Movimiento cancelado.";
          },
        },
      }}
    >
      <div
        className="mb-4 flex gap-2 overflow-x-auto md:hidden"
        aria-label="Seleccionar estado visible"
      >
        {ticketStatuses.map((status) => (
          <Button
            key={status}
            variant={mobileStatus === status ? "primary" : "secondary"}
            className="shrink-0"
            onClick={() => setMobileStatus(status)}
          >
            {statusLabels[status]} ({grouped[status].length})
          </Button>
        ))}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8">
        {ticketStatuses.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tickets={grouped[status]}
            canDrag={canDrag}
            mobileStatus={mobileStatus}
            onMobileMove={(ticket, nextStatus) =>
              void moveTicket(ticket, nextStatus, grouped[nextStatus].length)
            }
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? (
          <article className="w-80 rounded-lg border border-primary bg-surface-container-lowest p-4">
            <p className="text-label-sm uppercase text-on-surface-variant">
              {activeTicket.key}
            </p>
            <p className="mt-3 text-headline-sm">{activeTicket.title}</p>
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
