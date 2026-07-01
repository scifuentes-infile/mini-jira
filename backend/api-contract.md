# API Contract - Mini Jira

## Decisiones de contrato

- Base URL: `/api/v1`
- Convención de rutas: REST, recursos en plural, segmentos en kebab-case.
- Envelope de éxito: `{ "data": ... , "error": null }`
- Envelope de error: `{ "data": null, "error": { "code": string, "message": string, "details"?: object } }`
- Paginación: `limit` y `offset` en listados potencialmente grandes. Respuesta con `items`, `total`, `limit`, `offset`.
- Autenticación: sesión HTTP-only cookie. Todos los endpoints salvo `POST /auth/login` requieren usuario autenticado.
- Concurrencia optimista: operaciones mutables sobre tickets reciben `version`. Si no coincide, responder `409 VERSION_CONFLICT` con el ticket vigente en `error.details.currentTicket`.

## Tipos

### User

```json
{
  "id": "user-admin",
  "username": "ana.admin",
  "name": "Ana Martínez",
  "email": "admin@minijira.test",
  "role": "admin",
  "status": "active",
  "avatarUrl": null,
  "createdAt": "2026-06-01T09:00:00.000Z",
  "updatedAt": "2026-06-15T09:00:00.000Z"
}
```

### UserSummary

```json
{
  "id": "user-diego",
  "username": "diego.dev",
  "name": "Diego López",
  "email": "diego@minijira.test",
  "status": "active",
  "avatarUrl": null
}
```

### Label

```json
{
  "id": "label-backend",
  "name": "Backend",
  "color": "primary-fixed"
}
```

### Ticket

```json
{
  "id": "ticket-1",
  "key": "MJ-001",
  "title": "Implementar control de concurrencia optimista",
  "description": "Enviar la versión actual del ticket y resolver conflictos.",
  "status": "in_progress",
  "priority": "high",
  "labels": [],
  "creator": {},
  "assignee": null,
  "createdAt": "2026-06-01T09:00:00.000Z",
  "updatedAt": "2026-06-16T09:00:00.000Z",
  "closedAt": null,
  "archivedAt": null,
  "position": 0,
  "version": 4
}
```

Enums:

- `role`: `admin`, `user`
- `user.status`: `active`, `inactive`
- `ticket.status`: `todo`, `in_progress`, `review`, `blocked`, `done`
- `priority`: `low`, `medium`, `high`
- `label.color`: `secondary-container`, `primary-fixed`, `tertiary-fixed`, `surface-container-highest`

## Errores HTTP

| Status | Code | Uso |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Payload o query params inválidos. |
| 401 | `UNAUTHENTICATED` | No hay sesión válida. |
| 401 | `INVALID_CREDENTIALS` | Login fallido. |
| 403 | `FORBIDDEN` | Usuario autenticado sin permisos. |
| 404 | `NOT_FOUND` | Recurso inexistente o no visible para el usuario. |
| 409 | `VERSION_CONFLICT` | La versión enviada no coincide con la versión vigente. |
| 422 | `ARCHIVED` | Intento de modificar ticket archivado. |
| 422 | `LAST_ADMIN` | Intento de desactivar al último administrador activo. |

Ejemplo `409`:

```json
{
  "data": null,
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "El ticket fue modificado por otra persona.",
    "details": {
      "currentTicket": {}
    }
  }
}
```

## P0 - Gestión crítica de tickets

### POST /auth/login

Inicia sesión.

Payload:

```json
{
  "email": "admin@minijira.test",
  "password": "demo123"
}
```

Response `200`:

```json
{
  "data": {
    "user": {}
  },
  "error": null
}
```

Errores: `401 INVALID_CREDENTIALS`, `400 VALIDATION_ERROR`.

### POST /auth/logout

Cierra la sesión vigente.

Payload: ninguno.

Response `204`: sin body.

Errores: ninguno relevante; operación idempotente.

### GET /auth/me

Obtiene el usuario autenticado.

Response `200`:

```json
{
  "data": {
    "user": {}
  },
  "error": null
}
```

Response `200` sin sesión:

```json
{
  "data": {
    "user": null
  },
  "error": null
}
```

### GET /tickets

Lista tickets visibles para el usuario, excluyendo archivados por defecto.

Query params:

| Param | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `search` | string | No | Busca por título. |
| `status` | TicketStatus | No | Filtra por estado. |
| `priority` | Priority | No | Filtra por prioridad. |
| `assigneeId` | string | No | Filtra por responsable. |
| `creatorId` | string | No | Filtra por creador. |
| `labelId` | string | No | Filtra por etiqueta. |
| `archived` | boolean | No | `true` devuelve archivados visibles; default `false`. |
| `limit` | number | No | Default `50`, máximo `100`. |
| `offset` | number | No | Default `0`. |

Response `200`:

```json
{
  "data": {
    "items": [],
    "total": 8,
    "limit": 50,
    "offset": 0
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`, `400 VALIDATION_ERROR`.

### POST /tickets

Crea un ticket activo en estado inicial `todo`.

Payload:

```json
{
  "title": "Configurar entrega del frontend",
  "description": "Preparar build estático, variables de entorno y fallback de rutas.",
  "priority": "high",
  "assigneeId": "user-diego",
  "labelIds": ["label-devops", "label-frontend"]
}
```

Response `201`:

```json
{
  "data": {
    "ticket": {}
  },
  "error": null
}
```

Reglas:

- `status` se asigna como `todo`.
- `creator` se toma de la sesión.
- `position` se coloca al final de la columna `todo`.
- `version` inicia en `1`.
- Registra auditoría `ticket_created`.

Errores: `401 UNAUTHENTICATED`, `400 VALIDATION_ERROR`.

### GET /tickets/{ticketId}

Obtiene el detalle de un ticket visible.

Response `200`:

```json
{
  "data": {
    "ticket": {}
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`, `404 NOT_FOUND`.

### PUT /tickets/{ticketId}

Actualiza campos editables del ticket.

Payload:

```json
{
  "title": "Implementar control de concurrencia optimista",
  "description": "Resolver conflictos sin sobrescribir cambios de otros usuarios.",
  "priority": "high",
  "assigneeId": "user-diego",
  "labelIds": ["label-backend"],
  "version": 4
}
```

Response `200`:

```json
{
  "data": {
    "ticket": {}
  },
  "error": null
}
```

Reglas:

- Solo admin o creador pueden editar.
- Ticket archivado no se puede editar.
- Incrementa `version`.
- Registra auditoría para cambios de `title`, `description`, `priority` y `assignee`.

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`, `422 ARCHIVED`, `400 VALIDATION_ERROR`.

### PATCH /tickets/{ticketId}/status

Cambia el estado del ticket desde detalle.

Payload:

```json
{
  "status": "review",
  "version": 4
}
```

Response `200`:

```json
{
  "data": {
    "ticket": {}
  },
  "error": null
}
```

Reglas:

- Solo admin o responsable asignado pueden cambiar estado.
- Si el estado nuevo es `done`, asigna `closedAt`.
- Si reabre desde `done`, limpia `closedAt`.
- Mueve el ticket al final de la columna destino.
- Registra auditoría `status_changed`.

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`, `422 ARCHIVED`, `400 VALIDATION_ERROR`.

### PATCH /tickets/{ticketId}/position

Mueve un ticket en el tablero kanban, con posible cambio de estado y posición.

Payload:

```json
{
  "status": "blocked",
  "position": 0,
  "version": 2
}
```

Response `200`:

```json
{
  "data": {
    "ticket": {}
  },
  "error": null
}
```

Reglas:

- Solo admin o responsable asignado pueden mover el ticket.
- Normaliza posiciones de columna origen y destino.
- Si cambia de estado, aplica las mismas reglas de `closedAt`.
- Registra auditoría `ticket_reordered` si no cambia estado, o `status_changed` si cambia estado.

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`, `422 ARCHIVED`, `400 VALIDATION_ERROR`.

### POST /tickets/{ticketId}/archive

Archiva lógicamente un ticket.

Payload:

```json
{
  "version": 4
}
```

Response `200`:

```json
{
  "data": {
    "ticket": {}
  },
  "error": null
}
```

Reglas:

- Solo admin o creador pueden archivar.
- No elimina físicamente el registro.
- Asigna `archivedAt`, incrementa `version` y normaliza posiciones.
- Registra auditoría `ticket_archived`.

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`.

### POST /tickets/{ticketId}/restore

Restaura un ticket archivado.

Payload:

```json
{
  "version": 7
}
```

Response `200`:

```json
{
  "data": {
    "ticket": {}
  },
  "error": null
}
```

Reglas:

- Solo admin puede restaurar.
- Limpia `archivedAt` e incrementa `version`.
- Registra auditoría `ticket_restored`.

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`.

## P1 - Colaboración y visibilidad operativa

### GET /tickets/{ticketId}/comments

Lista comentarios de un ticket visible, ordenados ascendente por `createdAt`.

Query params:

| Param | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `limit` | number | No | Default `50`, máximo `100`. |
| `offset` | number | No | Default `0`. |

Response `200`:

```json
{
  "data": {
    "items": [],
    "total": 3,
    "limit": 50,
    "offset": 0
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`, `404 NOT_FOUND`.

### POST /tickets/{ticketId}/comments

Agrega comentario a un ticket activo.

Payload:

```json
{
  "body": "Bloqueado hasta confirmar la configuración del proxy.",
  "idempotencyKey": "01J-comment-submit-unique"
}
```

Response `201`:

```json
{
  "data": {
    "comment": {
      "id": "comment-3",
      "ticketId": "ticket-5",
      "author": {},
      "body": "Bloqueado hasta confirmar la configuración del proxy.",
      "createdAt": "2026-06-17T11:00:00.000Z",
      "updatedAt": "2026-06-17T11:00:00.000Z"
    },
    "notifications": [
      {
        "type": "user_mentioned",
        "recipientUserId": "user-sofia"
      }
    ]
  },
  "error": null
}
```

Reglas:

- `body` requerido, máximo `2000` caracteres.
- Ticket archivado no admite comentarios.
- Detecta menciones con formato `@username`.
- `idempotencyKey` evita duplicar notificaciones en reintentos.
- Comentarios simultáneos se ordenan por `createdAt` y `id`.

Errores: `401 UNAUTHENTICATED`, `404 NOT_FOUND`, `422 ARCHIVED`, `400 VALIDATION_ERROR`.

### GET /tickets/{ticketId}/audit-logs

Lista actividad/auditoría de un ticket visible, ordenada descendente por `createdAt`.

Query params:

| Param | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `limit` | number | No | Default `50`, máximo `100`. |
| `offset` | number | No | Default `0`. |

Response `200`:

```json
{
  "data": {
    "items": [
      {
        "id": "audit-status-1",
        "ticketId": "ticket-1",
        "actor": {},
        "action": "status_changed",
        "field": "status",
        "oldValue": "todo",
        "newValue": "in_progress",
        "createdAt": "2026-06-16T09:00:00.000Z"
      }
    ],
    "total": 2,
    "limit": 50,
    "offset": 0
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`, `404 NOT_FOUND`.

### GET /dashboard

Obtiene métricas visibles para el usuario autenticado.

Response `200`:

```json
{
  "data": {
    "byStatus": {
      "todo": 2,
      "in_progress": 1,
      "review": 2,
      "blocked": 1,
      "done": 1
    },
    "blocked": 1,
    "averageCloseDays": 12.5,
    "closedByMonth": [
      {
        "month": "Jun",
        "total": 1
      }
    ],
    "activeByAssignee": [
      {
        "name": "Diego López",
        "total": 2
      }
    ]
  },
  "error": null
}
```

Reglas:

- Admin ve métricas globales.
- Usuario normal ve tickets creados por él o asignados a él.
- Excluye tickets archivados.
- `closedByMonth` usa `closedAt`.
- `averageCloseDays` usa diferencia entre `createdAt` y `closedAt`.

Errores: `401 UNAUTHENTICATED`.

### GET /notifications

Lista notificaciones del usuario autenticado.

Query params:

| Param | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `unread` | boolean | No | Filtra no leídas. |
| `limit` | number | No | Default `50`, máximo `100`. |
| `offset` | number | No | Default `0`. |

Response `200`:

```json
{
  "data": {
    "items": [
      {
        "id": "notification-1",
        "type": "user_mentioned",
        "ticketId": "ticket-1",
        "recipientUserId": "user-sofia",
        "readAt": null,
        "createdAt": "2026-06-17T11:00:00.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`.

### PATCH /notifications/{notificationId}

Marca una notificación como leída/no leída.

Payload:

```json
{
  "read": true
}
```

Response `200`:

```json
{
  "data": {
    "notification": {}
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`, `404 NOT_FOUND`, `400 VALIDATION_ERROR`.

## P2 - Catálogos y administración

### GET /users

Lista usuarios del espacio de trabajo. Se usa para filtros, asignación y administración.

Query params:

| Param | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `status` | UserStatus | No | Filtra por estado. |
| `role` | Role | No | Filtra por rol. |
| `limit` | number | No | Default `100`, máximo `200`. |
| `offset` | number | No | Default `0`. |

Response `200`:

```json
{
  "data": {
    "items": [],
    "total": 5,
    "limit": 100,
    "offset": 0
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`.

### PATCH /users/{userId}

Actualiza datos administrativos de usuario.

Payload:

```json
{
  "name": "Ana Martínez",
  "email": "admin@minijira.test",
  "role": "admin",
  "status": "active"
}
```

Response `200`:

```json
{
  "data": {
    "user": {}
  },
  "error": null
}
```

Reglas:

- Solo admin puede actualizar usuarios.
- No permite desactivar al último admin activo.
- `name` y `email` son opcionales aunque el frontend actual solo cambia `role` y `status`.

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `422 LAST_ADMIN`, `400 VALIDATION_ERROR`.

### GET /labels

Lista etiquetas disponibles para crear/editar tickets y filtrar.

Response `200`:

```json
{
  "data": {
    "items": []
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`.

### POST /labels

Crea una etiqueta. No está consumido por el frontend actual, pero completa la administración del catálogo.

Payload:

```json
{
  "name": "Backend",
  "color": "primary-fixed"
}
```

Response `201`:

```json
{
  "data": {
    "label": {}
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `400 VALIDATION_ERROR`.

### PATCH /labels/{labelId}

Actualiza una etiqueta. No está consumido por el frontend actual.

Payload:

```json
{
  "name": "Frontend",
  "color": "secondary-container"
}
```

Response `200`:

```json
{
  "data": {
    "label": {}
  },
  "error": null
}
```

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `400 VALIDATION_ERROR`.

### DELETE /labels/{labelId}

Elimina una etiqueta del catálogo si no rompe integridad. No está consumido por el frontend actual.

Payload: ninguno.

Response `204`: sin body.

Errores: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 LABEL_IN_USE`.

## Notas de trazabilidad frontend

- Operaciones extraídas desde `mockApi`: `login`, `logout`, `me`, `listUsers`, `updateUser`, `listLabels`, `listTickets`, `getTicket`, `createTicket`, `updateTicket`, `changeStatus`, `reorderTicket`, `archiveTicket`, `restoreTicket`, `listComments`, `addComment`, `listAudit`, `dashboard`.
- `ticketQueries` confirma las mutaciones de tickets y la invalidación de dashboard tras cambios de estado, orden, archivado y restauración.
- `backlog.md` prioriza como MVP la gestión segura de tickets, colaboración con comentarios/notificaciones/concurrencia y dashboard con permisos.
