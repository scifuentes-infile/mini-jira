import type { AuditLog, Comment, Label, Ticket, User } from "../types/domain";

const now = new Date();
const date = (daysAgo: number, hours = 9) => {
  const value = new Date(now);
  value.setDate(value.getDate() - daysAgo);
  value.setHours(hours, 0, 0, 0);
  return value.toISOString();
};

export const users: User[] = [
  {
    id: "user-admin",
    username: "ana.admin",
    name: "Ana Martínez",
    email: "admin@minijira.test",
    role: "admin",
    status: "active",
    avatarUrl: null,
    createdAt: date(180),
    updatedAt: date(2),
  },
  {
    id: "user-diego",
    username: "diego.dev",
    name: "Diego López",
    email: "diego@minijira.test",
    role: "user",
    status: "active",
    avatarUrl: null,
    createdAt: date(150),
    updatedAt: date(4),
  },
  {
    id: "user-sofia",
    username: "sofia.qa",
    name: "Sofía Ramírez",
    email: "sofia@minijira.test",
    role: "user",
    status: "active",
    avatarUrl: null,
    createdAt: date(130),
    updatedAt: date(6),
  },
  {
    id: "user-marco",
    username: "marco.ux",
    name: "Marco Torres",
    email: "marco@minijira.test",
    role: "user",
    status: "active",
    avatarUrl: null,
    createdAt: date(120),
    updatedAt: date(10),
  },
  {
    id: "user-elena",
    username: "elena.ops",
    name: "Elena Castillo",
    email: "elena@minijira.test",
    role: "user",
    status: "inactive",
    avatarUrl: null,
    createdAt: date(100),
    updatedAt: date(20),
  },
];

export const labels: Label[] = [
  { id: "label-backend", name: "Backend", color: "primary-fixed" },
  { id: "label-frontend", name: "Frontend", color: "secondary-container" },
  { id: "label-bug", name: "Bug", color: "tertiary-fixed" },
  {
    id: "label-devops",
    name: "DevOps",
    color: "surface-container-highest",
  },
];

const summary = (id: string) => {
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error("Usuario mock inexistente");
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    status: user.status,
    avatarUrl: user.avatarUrl,
  };
};

export const tickets: Ticket[] = [
  {
    id: "ticket-1",
    key: "MJ-001",
    title: "Implementar control de concurrencia optimista",
    description:
      "Enviar la versión actual del ticket y resolver conflictos sin sobrescribir cambios de otros usuarios.",
    status: "in_progress",
    priority: "high",
    labels: [labels[0]!],
    creator: summary("user-admin"),
    assignee: summary("user-diego"),
    createdAt: date(16),
    updatedAt: date(1),
    closedAt: null,
    archivedAt: null,
    position: 0,
    version: 4,
  },
  {
    id: "ticket-2",
    key: "MJ-002",
    title: "Diseñar la experiencia del inicio de sesión",
    description:
      "Crear un acceso claro con estados de error, carga y sesión expirada.",
    status: "todo",
    priority: "medium",
    labels: [labels[1]!],
    creator: summary("user-marco"),
    assignee: summary("user-marco"),
    createdAt: date(12),
    updatedAt: date(3),
    closedAt: null,
    archivedAt: null,
    position: 0,
    version: 2,
  },
  {
    id: "ticket-3",
    key: "MJ-003",
    title: "Corregir duplicados en notificaciones por correo",
    description:
      "Aplicar una clave de idempotencia a los eventos de notificación.",
    status: "done",
    priority: "high",
    labels: [labels[2]!, labels[0]!],
    creator: summary("user-admin"),
    assignee: summary("user-diego"),
    createdAt: date(40),
    updatedAt: date(5),
    closedAt: date(5),
    archivedAt: null,
    position: 0,
    version: 6,
  },
  {
    id: "ticket-4",
    key: "MJ-004",
    title: "Validar flujo de archivado y restauración",
    description:
      "Cubrir permisos y confirmar que los tickets archivados no aparezcan en métricas activas.",
    status: "review",
    priority: "medium",
    labels: [labels[2]!],
    creator: summary("user-sofia"),
    assignee: summary("user-sofia"),
    createdAt: date(9),
    updatedAt: date(2),
    closedAt: null,
    archivedAt: null,
    position: 0,
    version: 3,
  },
  {
    id: "ticket-5",
    key: "MJ-005",
    title: "Configurar entrega del frontend",
    description:
      "Preparar build estático, variables de entorno y fallback de rutas.",
    status: "blocked",
    priority: "high",
    labels: [labels[3]!, labels[1]!],
    creator: summary("user-admin"),
    assignee: summary("user-diego"),
    createdAt: date(8),
    updatedAt: date(0),
    closedAt: null,
    archivedAt: null,
    position: 0,
    version: 2,
  },
  {
    id: "ticket-6",
    key: "MJ-006",
    title: "Documentar estados vacíos del tablero",
    description:
      "Definir mensajes y acciones para columnas y listados sin resultados.",
    status: "todo",
    priority: "low",
    labels: [labels[1]!],
    creator: summary("user-marco"),
    assignee: null,
    createdAt: date(6),
    updatedAt: date(4),
    closedAt: null,
    archivedAt: null,
    position: 1,
    version: 1,
  },
  {
    id: "ticket-7",
    key: "MJ-007",
    title: "Revisar consultas agregadas del dashboard",
    description:
      "Comprobar métricas por estado, responsable y tiempo promedio de cierre.",
    status: "review",
    priority: "medium",
    labels: [labels[0]!],
    creator: summary("user-diego"),
    assignee: summary("user-sofia"),
    createdAt: date(20),
    updatedAt: date(1),
    closedAt: null,
    archivedAt: null,
    position: 1,
    version: 5,
  },
  {
    id: "ticket-8",
    key: "MJ-008",
    title: "Retirar experimento de navegación anterior",
    description: "Ticket histórico conservado para fines de auditoría.",
    status: "done",
    priority: "low",
    labels: [labels[1]!],
    creator: summary("user-admin"),
    assignee: summary("user-elena"),
    createdAt: date(80),
    updatedAt: date(30),
    closedAt: date(50),
    archivedAt: date(30),
    position: 0,
    version: 7,
  },
];

export const comments: Comment[] = [
  {
    id: "comment-1",
    ticketId: "ticket-1",
    author: summary("user-admin"),
    body: "Necesitamos conservar el borrador cuando la API responda con conflicto.",
    createdAt: date(3, 10),
    updatedAt: date(3, 10),
  },
  {
    id: "comment-2",
    ticketId: "ticket-1",
    author: summary("user-diego"),
    body: "Entendido, @sofia.qa también validará el escenario desde pruebas.",
    createdAt: date(2, 15),
    updatedAt: date(2, 15),
  },
  {
    id: "comment-3",
    ticketId: "ticket-5",
    author: summary("user-diego"),
    body: "Bloqueado hasta confirmar la configuración del proxy.",
    createdAt: date(0, 11),
    updatedAt: date(0, 11),
  },
];

export const auditLogs: AuditLog[] = tickets.flatMap((ticket, index) => [
  {
    id: `audit-create-${index}`,
    ticketId: ticket.id,
    actor: ticket.creator,
    action: "ticket_created",
    field: null,
    oldValue: null,
    newValue: ticket.status,
    createdAt: ticket.createdAt,
  },
  {
    id: `audit-status-${index}`,
    ticketId: ticket.id,
    actor: ticket.assignee ?? ticket.creator,
    action: "status_changed",
    field: "status",
    oldValue: "todo",
    newValue: ticket.status,
    createdAt: ticket.updatedAt,
  },
]);
