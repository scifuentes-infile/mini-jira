import { Plus } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import type { User } from "../../types/domain";

export function BoardPageHeader({
  archived,
  users,
  onCreate,
}: {
  archived: boolean;
  users: User[];
  onCreate: () => void;
}) {
  const activeUsers = users
    .filter((user) => user.status === "active")
    .slice(0, 4);

  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <nav
          aria-label="Ruta de navegación"
          className="mb-2 flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant"
        >
          <span>Espacio de trabajo</span>
          <span aria-hidden="true">/</span>
          <span>Equipo interno</span>
          <span aria-hidden="true">/</span>
          <span className="text-on-surface">
            {archived ? "Archivados" : "Tablero Kanban"}
          </span>
        </nav>
        <h1 className="text-display-lg text-on-surface">
          {archived ? "Tickets archivados" : "Trabajo del equipo"}
        </h1>
        <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
          {archived
            ? "Consulta los tickets que ya no forman parte del trabajo activo."
            : "Organiza prioridades, responsables y estados desde un único tablero."}
        </p>
      </div>
      {!archived ? (
        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <div
            className="flex -space-x-2"
            aria-label="Miembros activos del equipo"
          >
            {activeUsers.map((user) => (
              <span
                key={user.id}
                className="rounded-full border-2 border-background"
              >
                <Avatar user={user} />
              </span>
            ))}
          </div>
          <Button icon={<Plus size={18} />} onClick={onCreate}>
            Crear ticket
          </Button>
        </div>
      ) : null}
    </header>
  );
}
