import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingState } from "../../components/feedback/States";
import { isApiError, mockApi } from "../../mocks/api";
import type { Role, UserStatus } from "../../types/domain";

export function AdminUsersPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["users"], queryFn: mockApi.listUsers });
  const mutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { role?: Role; status?: UserStatus };
    }) => mockApi.updateUser(id, patch),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado.");
    },
    onError: (error) =>
      toast.error(
        isApiError(error) ? error.message : "No fue posible actualizar.",
      ),
  });

  if (query.isPending) return <LoadingState label="Cargando usuarios" />;
  if (query.isError) {
    return <ErrorState message="No fue posible cargar los usuarios." />;
  }

  return (
    <div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Configuración
        </p>
        <h1 className="mt-1 text-3xl font-bold">Administración</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Gestiona roles y acceso de los miembros del equipo.
        </p>
      </header>

      <section className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {query.data.map((user) => (
              <tr
                key={user.id}
                className="border-t border-outline-variant hover:bg-surface-container-low"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="sm" />
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-on-surface-variant">{user.email}</td>
                <td className="p-4">
                  <select
                    aria-label={`Rol de ${user.name}`}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2"
                    value={user.role}
                    disabled={mutation.isPending}
                    onChange={(event) =>
                      mutation.mutate({
                        id: user.id,
                        patch: { role: event.target.value as Role },
                      })
                    }
                  >
                    <option value="admin">Administrador</option>
                    <option value="user">Usuario</option>
                  </select>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.status === "active"
                        ? "bg-status-done text-on-surface"
                        : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {user.status === "active" ? (
                      <UserCheck size={14} />
                    ) : (
                      <UserX size={14} />
                    )}
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="secondary"
                    disabled={mutation.isPending}
                    icon={<ShieldCheck size={16} />}
                    onClick={() =>
                      mutation.mutate({
                        id: user.id,
                        patch: {
                          status:
                            user.status === "active" ? "inactive" : "active",
                        },
                      })
                    }
                  >
                    {user.status === "active" ? "Desactivar" : "Activar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
