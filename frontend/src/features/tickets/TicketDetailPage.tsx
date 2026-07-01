import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  History,
  MessageSquare,
  Pencil,
  RotateCcw,
  Send,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { ErrorState, LoadingState } from "../../components/feedback/States";
import { Avatar } from "../../components/ui/Avatar";
import {
  priorityLabels,
  statusClasses,
  statusLabels,
  ticketStatuses,
} from "../../lib/constants";
import { formatDate, formatRelativeDate } from "../../lib/format";
import { isApiError, mockApi } from "../../mocks/api";
import type { ApiError, TicketStatus } from "../../types/domain";
import { useAuth } from "../auth/AuthContext";
import { TicketForm } from "./TicketForm";
import {
  ticketKeys,
  useArchiveTicket,
  useChangeStatus,
  useRestoreTicket,
  useTicket,
  useUpdateTicket,
} from "./ticketQueries";

export function TicketDetailPage() {
  const { ticketId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const ticketQuery = useTicket(ticketId);
  const commentsQuery = useQuery({
    queryKey: ["comments", ticketId],
    queryFn: () => mockApi.listComments(ticketId),
  });
  const auditQuery = useQuery({
    queryKey: ["audit", ticketId],
    queryFn: () => mockApi.listAudit(ticketId),
  });
  const updateMutation = useUpdateTicket(ticketId);
  const statusMutation = useChangeStatus();
  const archiveMutation = useArchiveTicket();
  const restoreMutation = useRestoreTicket();
  const addComment = useMutation({
    mutationFn: (body: string) => mockApi.addComment(ticketId, body),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["comments", ticketId] }),
  });
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"comments" | "audit">("comments");
  const [comment, setComment] = useState("");
  const [conflict, setConflict] = useState<ApiError | null>(null);

  if (ticketQuery.isPending) return <LoadingState label="Cargando ticket" />;
  if (ticketQuery.isError || !ticketQuery.data) {
    return <ErrorState message="El ticket no existe o no está disponible." />;
  }
  const ticket = ticketQuery.data;
  const canEdit =
    !ticket.archivedAt &&
    (user?.role === "admin" || ticket.creator.id === user?.id);
  const canChange =
    !ticket.archivedAt &&
    (user?.role === "admin" || ticket.assignee?.id === user?.id);
  const canArchive =
    !ticket.archivedAt &&
    (user?.role === "admin" || ticket.creator.id === user?.id);

  async function runAction(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setConflict(error);
      } else {
        toast.error(
          isApiError(error) ? error.message : "La operación no se completó.",
        );
      }
    }
  }

  return (
    <div>
      <Link
        to={ticket.archivedAt ? "/archived" : "/tickets"}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft size={17} />
        Volver a {ticket.archivedAt ? "archivados" : "tickets"}
      </Link>

      <header className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {ticket.key}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[ticket.status]}`}
              >
                {statusLabels[ticket.status]}
              </span>
              {ticket.archivedAt ? (
                <span className="rounded-full bg-surface-container-highest px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                  Archivado
                </span>
              ) : null}
            </div>
            <h1 className="max-w-4xl text-2xl font-bold sm:text-3xl">
              {ticket.title}
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Creado por {ticket.creator.name} · {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button
                variant="secondary"
                onClick={() => setEditing(true)}
                icon={<Pencil size={17} />}
              >
                Editar
              </Button>
            ) : null}
            {canArchive ? (
              <Button
                variant="danger"
                disabled={archiveMutation.isPending}
                onClick={() => {
                  if (window.confirm("¿Archivar este ticket?")) {
                    void runAction(
                      () =>
                        archiveMutation
                          .mutateAsync({
                            id: ticket.id,
                            version: ticket.version,
                          })
                          .then(() => navigate("/tickets")),
                      "Ticket archivado.",
                    );
                  }
                }}
                icon={<Archive size={17} />}
              >
                Archivar
              </Button>
            ) : null}
            {ticket.archivedAt && user?.role === "admin" ? (
              <Button
                disabled={restoreMutation.isPending}
                onClick={() =>
                  void runAction(
                    () =>
                      restoreMutation
                        .mutateAsync({
                          id: ticket.id,
                          version: ticket.version,
                        })
                        .then(() => navigate("/tickets")),
                    "Ticket restaurado.",
                  )
                }
                icon={<RotateCcw size={17} />}
              >
                Restaurar
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-semibold">Descripción</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">
            {ticket.description}
          </p>
        </section>
        <aside className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="mb-4 text-lg font-semibold">Detalles</h2>
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Estado
              </dt>
              <dd className="mt-1">
                {canChange ? (
                  <select
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2"
                    value={ticket.status}
                    disabled={statusMutation.isPending}
                    onChange={(event) =>
                      void runAction(
                        () =>
                          statusMutation.mutateAsync({
                            id: ticket.id,
                            status: event.target.value as TicketStatus,
                            version: ticket.version,
                          }),
                        "Estado actualizado.",
                      )
                    }
                  >
                    {ticketStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                ) : (
                  statusLabels[ticket.status]
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Prioridad
              </dt>
              <dd className="mt-1 font-semibold">
                {priorityLabels[ticket.priority]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Responsable
              </dt>
              <dd className="mt-2">
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar user={ticket.assignee} size="sm" />
                    <span>{ticket.assignee.name}</span>
                  </div>
                ) : (
                  "Sin asignar"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Etiquetas
              </dt>
              <dd className="mt-2 flex flex-wrap gap-1">
                {ticket.labels.length
                  ? ticket.labels.map((label) => (
                      <span
                        key={label.id}
                        className="rounded-full bg-secondary-container px-2 py-1 text-xs font-semibold text-on-secondary-container"
                      >
                        {label.name}
                      </span>
                    ))
                  : "Sin etiquetas"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Última actualización
              </dt>
              <dd className="mt-1">{formatRelativeDate(ticket.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Control de versión
              </dt>
              <dd className="mt-1">v{ticket.version}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="mt-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex border-b border-outline-variant p-2">
          <Button
            variant={tab === "comments" ? "primary" : "ghost"}
            onClick={() => setTab("comments")}
            icon={<MessageSquare size={17} />}
          >
            Comentarios
          </Button>
          <Button
            variant={tab === "audit" ? "primary" : "ghost"}
            onClick={() => setTab("audit")}
            icon={<History size={17} />}
          >
            Actividad
          </Button>
        </div>
        <div className="p-5 sm:p-6">
          {tab === "comments" ? (
            <>
              {!ticket.archivedAt ? (
                <form
                  className="mb-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const body = comment.trim();
                    if (!body) return;
                    void runAction(
                      () =>
                        addComment.mutateAsync(body).then(() => setComment("")),
                      "Comentario agregado.",
                    );
                  }}
                >
                  <label className="text-sm font-semibold" htmlFor="comment">
                    Agregar comentario
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    maxLength={2000}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Escribe un comentario. Usa @usuario para mencionar."
                    className="mt-2 min-h-24 w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-sm"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={!comment.trim() || addComment.isPending}
                      icon={<Send size={16} />}
                    >
                      Comentar
                    </Button>
                  </div>
                </form>
              ) : null}
              {commentsQuery.isPending ? (
                <LoadingState label="Cargando comentarios" />
              ) : (
                <div className="grid gap-5">
                  {commentsQuery.data?.map((item) => (
                    <article key={item.id} className="flex gap-3">
                      <Avatar user={item.author} size="sm" />
                      <div className="min-w-0 flex-1 rounded-lg bg-surface-container-low p-4">
                        <header className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">
                            {item.author.name}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {formatDate(item.createdAt)}
                          </span>
                          {item.updatedAt !== item.createdAt ? (
                            <span className="text-xs text-on-surface-variant">
                              Editado
                            </span>
                          ) : null}
                        </header>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {item.body}
                        </p>
                      </div>
                    </article>
                  ))}
                  {!commentsQuery.data?.length ? (
                    <p className="text-sm text-on-surface-variant">
                      Aún no hay comentarios.
                    </p>
                  ) : null}
                </div>
              )}
            </>
          ) : auditQuery.isPending ? (
            <LoadingState label="Cargando actividad" />
          ) : (
            <ol className="grid gap-4">
              {auditQuery.data?.map((item) => (
                <li
                  key={item.id}
                  className="border-l-2 border-primary pl-4 text-sm"
                >
                  <p>
                    <strong>{item.actor.name}</strong> ·{" "}
                    {item.action.replaceAll("_", " ")}
                  </p>
                  {item.field ? (
                    <p className="mt-1 text-on-surface-variant">
                      {item.oldValue ?? "Sin valor"} →{" "}
                      {item.newValue ?? "Sin valor"}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formatDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {editing ? (
        <Modal title={`Editar ${ticket.key}`} onClose={() => setEditing(false)}>
          <TicketForm
            ticket={ticket}
            onCancel={() => setEditing(false)}
            submitting={updateMutation.isPending}
            onSubmit={async (input) => {
              try {
                await updateMutation.mutateAsync({
                  ...input,
                  version: ticket.version,
                });
                setEditing(false);
                toast.success("Ticket actualizado.");
              } catch (error) {
                if (isApiError(error) && error.status === 409) {
                  setConflict(error);
                } else {
                  toast.error(
                    isApiError(error)
                      ? error.message
                      : "No fue posible actualizar.",
                  );
                }
              }
            }}
          />
        </Modal>
      ) : null}

      {conflict ? (
        <Modal
          title="Cambios concurrentes detectados"
          onClose={() => setConflict(null)}
        >
          <p className="text-sm leading-6 text-on-surface-variant">
            Otra persona modificó este ticket. Recarga la versión más reciente
            antes de volver a guardar.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConflict(null)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                if (conflict.currentTicket) {
                  client.setQueryData(
                    ticketKeys.detail(ticketId),
                    conflict.currentTicket,
                  );
                } else {
                  void ticketQuery.refetch();
                }
                setEditing(false);
                setConflict(null);
              }}
            >
              Recargar versión
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
