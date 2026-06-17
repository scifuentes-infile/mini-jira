import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/feedback/States";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Surface } from "../../components/ui/Surface";
import {
  priorityLabels,
  statusClasses,
  statusLabels,
  ticketStatuses,
} from "../../lib/constants";
import { isApiError, mockApi } from "../../mocks/api";
import type { Priority, TicketFilters, TicketStatus } from "../../types/domain";
import { useAuth } from "../auth/AuthContext";
import {
  KanbanBoard,
  type KanbanStatusDefinition,
  type KanbanTask,
} from "../kanban";
import { BoardPageHeader } from "./BoardPageHeader";
import { TicketForm } from "./TicketForm";
import { useCreateTicket, useReorderTicket, useTickets } from "./ticketQueries";

const kanbanColumns: KanbanStatusDefinition[] = ticketStatuses.map(
  (status) => ({
    id: status,
    label: statusLabels[status],
    emptyMessage: `No hay tickets en ${statusLabels[status].toLowerCase()}.`,
  }),
);

export function TicketsPage({ archived = false }: { archived?: boolean }) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const view = archived ? "list" : (params.get("view") ?? "board");
  const createOpen = params.get("create") === "1";
  const filters: TicketFilters = {
    archived,
    search: params.get("search") || undefined,
    status: (params.get("status") as TicketStatus | null) || undefined,
    priority: (params.get("priority") as Priority | null) || undefined,
    assigneeId: params.get("assignee") || undefined,
  };
  const ticketsQuery = useTickets(filters);
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: mockApi.listUsers,
  });
  const createMutation = useCreateTicket();
  const reorderMutation = useReorderTicket();

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "view") next.delete("page");
    setParams(next);
  }

  function canChange(task: KanbanTask) {
    return user?.role === "admin" || task.assignee?.id === user?.id;
  }

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.priority,
    filters.assigneeId,
  ].filter(Boolean).length;

  return (
    <div>
      <BoardPageHeader
        archived={archived}
        users={usersQuery.data ?? []}
        onCreate={() => updateParam("create", "1")}
      />

      <Surface className="mb-6 rounded-xl p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Button
              variant={filtersOpen ? "primary" : "secondary"}
              onClick={() => setFiltersOpen((value) => !value)}
              icon={<SlidersHorizontal size={18} />}
            >
              Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </Button>
            {filters.search ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary-container px-3 text-body-sm font-semibold text-on-secondary-container">
                Búsqueda: {filters.search}
                <button
                  type="button"
                  aria-label="Quitar búsqueda"
                  onClick={() => updateParam("search")}
                >
                  <X size={15} />
                </button>
              </span>
            ) : null}
          </div>
          {!archived ? (
            <div className="flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
              <Button
                variant={view === "board" ? "primary" : "ghost"}
                className="min-h-8 px-3 py-1"
                onClick={() => updateParam("view", "board")}
                icon={<LayoutGrid size={16} />}
              >
                Tablero
              </Button>
              <Button
                variant={view === "list" ? "primary" : "ghost"}
                className="min-h-8 px-3 py-1"
                onClick={() => updateParam("view", "list")}
                icon={<List size={16} />}
              >
                Lista
              </Button>
            </div>
          ) : null}
        </div>
        {filtersOpen ? (
          <div className="mt-3 grid gap-3 border-t border-outline-variant pt-3 sm:grid-cols-3">
            <select
              aria-label="Filtrar por estado"
              className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md"
              value={filters.status ?? ""}
              onChange={(event) => updateParam("status", event.target.value)}
            >
              <option value="">Todos los estados</option>
              {ticketStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por prioridad"
              className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md"
              value={filters.priority ?? ""}
              onChange={(event) => updateParam("priority", event.target.value)}
            >
              <option value="">Todas las prioridades</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por responsable"
              className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md"
              value={filters.assigneeId ?? ""}
              onChange={(event) => updateParam("assignee", event.target.value)}
            >
              <option value="">Todos los responsables</option>
              {usersQuery.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </Surface>

      {ticketsQuery.isPending ? (
        <LoadingState label="Cargando tickets" />
      ) : null}
      {ticketsQuery.isError ? (
        <ErrorState message="No fue posible cargar los tickets." />
      ) : null}
      {ticketsQuery.data && !ticketsQuery.data.length ? (
        <EmptyState
          title="No hay tickets para mostrar"
          description="Ajusta los filtros o crea el primer ticket del equipo."
          action={
            !archived ? (
              <Button onClick={() => updateParam("create", "1")}>
                Crear ticket
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {ticketsQuery.data?.length && view === "board" ? (
        <KanbanBoard
          tasks={ticketsQuery.data}
          columns={kanbanColumns}
          canDragTask={canChange}
          onMove={async ({ task, destinationStatus, destinationIndex }) => {
            await reorderMutation.mutateAsync({
              id: task.id,
              status: destinationStatus,
              position: destinationIndex,
              version: task.version,
            });
            toast.success(
              `Ticket movido a ${statusLabels[destinationStatus]}, posición ${destinationIndex + 1}.`,
            );
          }}
          onMoveError={(error) =>
            toast.error(
              isApiError(error)
                ? error.message
                : error instanceof Error
                  ? error.message
                  : "No fue posible mover el ticket.",
            )
          }
        />
      ) : null}

      {ticketsQuery.data?.length && view === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full min-w-3xl border-collapse text-left text-body-md">
            <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="p-4">Ticket</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Prioridad</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Versión</th>
              </tr>
            </thead>
            <tbody>
              {ticketsQuery.data.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-t border-outline-variant hover:bg-surface-container-low"
                >
                  <td className="p-4">
                    <Link
                      className="font-semibold text-primary hover:underline"
                      to={`/tickets/${ticket.id}`}
                    >
                      {ticket.key} · {ticket.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-label-sm ${statusClasses[ticket.status]}`}
                    >
                      {statusLabels[ticket.status]}
                    </span>
                  </td>
                  <td className="p-4">{priorityLabels[ticket.priority]}</td>
                  <td className="p-4">
                    {ticket.assignee?.name ?? "Sin asignar"}
                  </td>
                  <td className="p-4">v{ticket.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {createOpen ? (
        <Modal title="Crear ticket" onClose={() => updateParam("create")}>
          <TicketForm
            onCancel={() => updateParam("create")}
            submitting={createMutation.isPending}
            onSubmit={async (input) => {
              try {
                await createMutation.mutateAsync(input);
                updateParam("create");
                toast.success("Ticket creado.");
              } catch (error) {
                toast.error(
                  isApiError(error)
                    ? error.message
                    : "No fue posible crear el ticket.",
                );
              }
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
