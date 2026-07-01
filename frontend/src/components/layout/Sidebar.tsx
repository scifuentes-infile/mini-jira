import {
  Archive,
  BarChart3,
  LogOut,
  Plus,
  Settings2,
  TicketCheck,
  Workflow,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

const baseLinks = [
  { to: "/tickets", label: "Mis tareas", icon: TicketCheck },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/archived", label: "Archivados", icon: Archive },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const links =
    user.role === "admin"
      ? [
          ...baseLinks,
          { to: "/admin/users", label: "Administración", icon: Settings2 },
        ]
      : baseLinks;

  return (
    <aside className="flex h-full w-60 flex-col border-r border-outline-variant bg-surface-container-lowest">
      <div className="flex min-h-24 items-start gap-3 px-6 py-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
          <Workflow size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="truncate text-headline-sm text-primary">Mini Jira</p>
          <p className="mt-0.5 truncate text-label-md text-on-surface-variant">
            Equipo de desarrollo
          </p>
        </div>
        {onClose ? (
          <IconButton
            label="Cerrar navegación"
            className="ml-auto lg:hidden"
            onClick={onClose}
          >
            <X size={20} />
          </IconButton>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Navegación principal">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-10 items-center gap-3 rounded-r-lg border-l-4 px-3 text-label-md transition-colors ${
                isActive
                  ? "border-primary bg-secondary-container text-on-secondary-container"
                  : "border-transparent text-on-surface-variant hover:bg-surface-container-high"
              }`
            }
          >
            <Icon size={19} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <Button
          className="w-full"
          icon={<Plus size={18} />}
          onClick={() => {
            navigate("/tickets?create=1");
            onClose?.();
          }}
        >
          Crear ticket
        </Button>
        <div className="mt-4 border-t border-outline-variant pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-body-md font-semibold">{user.name}</p>
              <p className="truncate text-body-sm text-on-surface-variant">
                {user.role === "admin" ? "Administrador" : "Usuario"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            icon={<LogOut size={18} />}
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  );
}
