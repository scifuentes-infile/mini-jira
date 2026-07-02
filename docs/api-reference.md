# API Reference - Mini Jira

Base URL: `/api/v1`

Envelope de exito:

```json
{ "data": {}, "error": null }
```

Envelope de error:

```json
{ "data": null, "error": { "code": "CODE", "message": "Mensaje", "details": {} } }
```

## Autenticacion

El contrato define autenticacion por sesion HTTP-only cookie. `POST /auth/login` inicia sesion y responde con el usuario autenticado; todos los endpoints salvo `POST /auth/login` requieren usuario autenticado.

El flujo JWT solicitado como `login -> token -> refresh` no esta especificado en `api-contract.md`: no hay campo `token` en la respuesta de login y no existe endpoint de refresh. Por esa razon, esta referencia no documenta `POST /auth/refresh` ni respuestas JWT inventadas.

Los ejemplos `curl` P0 incluyen `Authorization: Bearer {token}` por requerimiento de esta documentacion, aunque el contrato base habla de sesion HTTP-only cookie. En `POST /auth/login`, ese header aparece solo para mantener consistencia con el requerimiento de ejemplos; el contrato no exige autenticacion previa para login.

## Endpoints

| Metodo | Ruta | Auth | Body (campos) | Response | Status codes posibles |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/login` | No | `email`, `password` | `{ data: { user }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` |
| POST | `/auth/logout` | Si | Ninguno | Sin body | `204` |
| GET | `/auth/me` | Si | Ninguno | `{ data: { user }, error: null }` o `{ data: { user: null }, error: null }` | `200` |
| GET | `/tickets` | Si | Query: `search`, `status`, `priority`, `assigneeId`, `creatorId`, `labelId`, `archived`, `limit`, `offset` | `{ data: { items, total, limit, offset }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED` |
| POST | `/tickets` | Si | `title`, `description`, `priority`, `assigneeId`, `labelIds` | `{ data: { ticket }, error: null }` | `201`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED` |
| GET | `/tickets/{ticketId}` | Si | Ninguno | `{ data: { ticket }, error: null }` | `200`, `401 UNAUTHENTICATED`, `404 NOT_FOUND` |
| PUT | `/tickets/{ticketId}` | Si | `title`, `description`, `priority`, `assigneeId`, `labelIds`, `version` | `{ data: { ticket }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`, `422 ARCHIVED` |
| PATCH | `/tickets/{ticketId}/status` | Si | `status`, `version` | `{ data: { ticket }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`, `422 ARCHIVED` |
| PATCH | `/tickets/{ticketId}/position` | Si | `status`, `position`, `version` | `{ data: { ticket }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`, `422 ARCHIVED` |
| POST | `/tickets/{ticketId}/archive` | Si | `version` | `{ data: { ticket }, error: null }` | `200`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT` |
| POST | `/tickets/{ticketId}/restore` | Si | `version` | `{ data: { ticket }, error: null }` | `200`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT` |
| GET | `/tickets/{ticketId}/comments` | Si | Query: `limit`, `offset` | `{ data: { items, total, limit, offset }, error: null }` | `200`, `401 UNAUTHENTICATED`, `404 NOT_FOUND` |
| POST | `/tickets/{ticketId}/comments` | Si | `body`, `idempotencyKey` | `{ data: { comment, notifications }, error: null }` | `201`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `404 NOT_FOUND`, `422 ARCHIVED` |
| GET | `/tickets/{ticketId}/audit-logs` | Si | Query: `limit`, `offset` | `{ data: { items, total, limit, offset }, error: null }` | `200`, `401 UNAUTHENTICATED`, `404 NOT_FOUND` |
| GET | `/dashboard` | Si | Ninguno | `{ data: { byStatus, blocked, averageCloseDays, closedByMonth, activeByAssignee }, error: null }` | `200`, `401 UNAUTHENTICATED` |
| GET | `/notifications` | Si | Query: `unread`, `limit`, `offset` | `{ data: { items, total, limit, offset }, error: null }` | `200`, `401 UNAUTHENTICATED` |
| PATCH | `/notifications/{notificationId}` | Si | `read` | `{ data: { notification }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `404 NOT_FOUND` |
| GET | `/users` | Si | Query: `status`, `role`, `limit`, `offset` | `{ data: { items, total, limit, offset }, error: null }` | `200`, `401 UNAUTHENTICATED` |
| PATCH | `/users/{userId}` | Si | `name`, `email`, `role`, `status` | `{ data: { user }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `422 LAST_ADMIN` |
| GET | `/labels` | Si | Ninguno | `{ data: { items }, error: null }` | `200`, `401 UNAUTHENTICATED` |
| POST | `/labels` | Si | `name`, `color` | `{ data: { label }, error: null }` | `201`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN` |
| PATCH | `/labels/{labelId}` | Si | `name`, `color` | `{ data: { label }, error: null }` | `200`, `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND` |
| DELETE | `/labels/{labelId}` | Si | Ninguno | Sin body | `204`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 LABEL_IN_USE` |

### Notas P2

Los endpoints bajo P2 son catalogos y administracion: `/users`, `/users/{userId}`, `/labels`, `/labels/{labelId}`. El contrato marca `POST /labels`, `PATCH /labels/{labelId}` y `DELETE /labels/{labelId}` como no consumidos por el frontend actual.

## Ejemplos curl P0

### POST /auth/login

```bash
curl -X POST "/api/v1/auth/login" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@minijira.test",
    "password": "demo123"
  }'
```

### POST /auth/logout

```bash
curl -X POST "/api/v1/auth/logout" \
  -H "Authorization: Bearer {token}"
```

### GET /auth/me

```bash
curl -X GET "/api/v1/auth/me" \
  -H "Authorization: Bearer {token}"
```

### GET /tickets

```bash
curl -X GET "/api/v1/tickets?status=in_progress&limit=50&offset=0" \
  -H "Authorization: Bearer {token}"
```

### POST /tickets

```bash
curl -X POST "/api/v1/tickets" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Configurar entrega del frontend",
    "description": "Preparar build estatico, variables de entorno y fallback de rutas.",
    "priority": "high",
    "assigneeId": "user-diego",
    "labelIds": ["label-devops", "label-frontend"]
  }'
```

### GET /tickets/{ticketId}

```bash
curl -X GET "/api/v1/tickets/{ticketId}" \
  -H "Authorization: Bearer {token}"
```

### PUT /tickets/{ticketId}

```bash
curl -X PUT "/api/v1/tickets/{ticketId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar control de concurrencia optimista",
    "description": "Resolver conflictos sin sobrescribir cambios de otros usuarios.",
    "priority": "high",
    "assigneeId": "user-diego",
    "labelIds": ["label-backend"],
    "version": 4
  }'
```

### PATCH /tickets/{ticketId}/status

```bash
curl -X PATCH "/api/v1/tickets/{ticketId}/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "review",
    "version": 4
  }'
```

### PATCH /tickets/{ticketId}/position

```bash
curl -X PATCH "/api/v1/tickets/{ticketId}/position" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "blocked",
    "position": 0,
    "version": 2
  }'
```

### POST /tickets/{ticketId}/archive

```bash
curl -X POST "/api/v1/tickets/{ticketId}/archive" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 4
  }'
```

### POST /tickets/{ticketId}/restore

```bash
curl -X POST "/api/v1/tickets/{ticketId}/restore" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 7
  }'
```
