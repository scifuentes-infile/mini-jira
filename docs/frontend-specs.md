# Especificación del frontend — Mini Jira

## 1. Alcance y decisiones base

Esta especificación define el frontend del MVP de Mini Jira. Se basa en
`specs.md`, `backlog.md` y la referencia visual de `stitch/`.

- Será una SPA responsive en español.
- Habrá un único equipo y un único espacio de trabajo; no se modelarán
  proyectos, sprints ni organizaciones.
- `stitch/DESIGN.md` define la dirección visual. `stitch/code.html` y
  `stitch/screen.png` son referencias, no contratos funcionales.
- El frontend consumirá una API REST. Mientras el backend no exista, se usará
  Mock Service Worker (MSW) con el mismo contrato.
- No habrá modo oscuro, notificaciones dentro de la aplicación, adjuntos,
  subtareas, columnas configurables ni edición colaborativa en tiempo real.
- No se escribirá código de aplicación hasta que este documento sea aprobado.

## 2. Stack y versiones

Versiones objetivo verificadas el 10 de junio de 2026:

| Área | Tecnología | Versión |
|---|---|---:|
| Runtime | Node.js LTS | 24.16.0 |
| Gestor de paquetes | npm | 11.x |
| UI | React | 19.2.7 |
| Lenguaje | TypeScript | 6.0.3 |
| Build y desarrollo | Vite | 8.0.16 |
| Plugin de React | `@vitejs/plugin-react` | 6.0.2 |
| Estilos | Tailwind CSS | 4.3.0 |
| Rutas | React Router | 7.17.0 |
| Datos remotos | TanStack Query | 5.101.0 |
| Formularios | React Hook Form | 7.78.0 |
| Esquemas | Zod | 4.4.3 |
| Adaptador de formularios | `@hookform/resolvers` | 5.4.0 |
| Gráficas | Recharts | 3.8.1 |
| Drag-and-drop | `@dnd-kit/core` | 6.3.1 |
| Ordenamiento DnD | `@dnd-kit/sortable` | 10.0.0 |
| Iconos | Lucide React | 1.17.0 |
| Fechas | date-fns | 4.4.0 |
| Toasts | Sonner | 2.0.7 |
| Pruebas unitarias | Vitest | 4.1.8 |
| Pruebas de componentes | Testing Library React | 16.3.2 |
| Interacción en pruebas | Testing Library User Event | 14.6.1 |
| Pruebas E2E | Playwright | 1.60.0 |
| Lint | ESLint | 10.4.1 |
| Formato | Prettier | 3.8.4 |

Se fijarán versiones exactas en `package-lock.json`. La versión local actual de
Node.js 18 no cumple el entorno objetivo y deberá actualizarse antes de instalar
o ejecutar el frontend.

## 3. Dependencias y criterios

- React Router gestionará rutas, layouts y protección por autenticación/rol.
- TanStack Query será la única fuente de estado remoto y administrará caché,
  invalidación, reintentos y mutaciones.
- React Hook Form y Zod gestionarán formularios y validación cliente.
- Tailwind CSS implementará los tokens de `stitch/DESIGN.md`; no se usará
  Material UI.
- dnd-kit permitirá mover tickets entre columnas con teclado y puntero.
- Recharts implementará únicamente las gráficas definidas en el dashboard.
- MSW simulará la API en desarrollo y pruebas sin cambiar los servicios de la
  aplicación.
- No se añadirá Redux ni otra biblioteca de estado global. El estado local,
  contexto de sesión, URL y TanStack Query cubren el alcance.

## 4. Modelo de datos

Todos los campos usan `camelCase` en el frontend. La capa API adaptará
`snake_case` si el backend lo utiliza. Fechas y horas viajan como ISO 8601 UTC y
se muestran en la zona horaria local del navegador.

### 4.1 Tipos base

```text
Role = "admin" | "user"
UserStatus = "active" | "inactive"
TicketStatus = "todo" | "in_progress" | "review" | "blocked" | "done"
Priority = "low" | "medium" | "high"
NotificationEvent = "ticket_assigned" | "user_mentioned" | "ticket_blocked"
```

`archived` no será un estado operativo. El archivado se representa mediante
`archivedAt`; un ticket archivado conserva el estado que tenía al archivarse.

### 4.2 User

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string UUID | Inmutable |
| `username` | string | Único, 3-30, letras, números, punto, guion y guion bajo |
| `name` | string | Obligatorio, 2-80 caracteres |
| `email` | string | Obligatorio, único y válido |
| `role` | `Role` | Obligatorio |
| `status` | `UserStatus` | Los inactivos conservan su historial |
| `avatarUrl` | string o null | URL HTTPS opcional |
| `createdAt` | datetime | Solo lectura |
| `updatedAt` | datetime | Solo lectura |

Las menciones usan `@username`. Los usuarios sin imagen muestran iniciales con
un color determinista.

### 4.3 Ticket

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string UUID | Identificador técnico |
| `key` | string | Visible, formato `MJ-` más número secuencial |
| `title` | string | Obligatorio, 3-120 caracteres |
| `description` | string | Texto plano, obligatorio, 1-5000 caracteres |
| `status` | `TicketStatus` | Inicial `todo` |
| `priority` | `Priority` | Obligatoria |
| `labels` | `Label[]` | 0-5 etiquetas |
| `creator` | `UserSummary` | Solo lectura |
| `assignee` | `UserSummary` o null | Puede quedar sin asignar |
| `createdAt` | datetime | Solo lectura |
| `updatedAt` | datetime | Solo lectura |
| `closedAt` | datetime o null | Se establece al entrar en `done` |
| `archivedAt` | datetime o null | Define si está archivado |
| `version` | integer | Inicia en 1 y aumenta en cada mutación |

Al salir de `done`, `closedAt` vuelve a `null`. Al regresar a `done`, toma la
fecha del cierre nuevo.

### 4.4 Label

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string UUID | Inmutable |
| `name` | string | Único sin distinguir mayúsculas, 1-30 caracteres |
| `color` | string | Token de una paleta accesible predefinida |

Las etiquetas son de catálogo. El administrador puede crearlas y editarlas
desde Gestión de usuarios y catálogos; no se eliminan si están en uso.

### 4.5 Comment

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string UUID | Inmutable |
| `ticketId` | string UUID | Obligatorio |
| `author` | `UserSummary` | Solo lectura |
| `body` | string | Texto plano, 1-2000 caracteres |
| `createdAt` | datetime | Solo lectura |
| `updatedAt` | datetime | Solo lectura |

El autor y el administrador pueden editar comentarios. La interfaz mostrará
“Editado” cuando `updatedAt` sea posterior a `createdAt`. No se eliminan
comentarios.

### 4.6 AuditLog

| Campo | Tipo |
|---|---|
| `id` | string UUID |
| `ticketId` | string UUID |
| `actor` | `UserSummary` |
| `action` | string enumerado por la API |
| `field` | string o null |
| `oldValue` | string o null |
| `newValue` | string o null |
| `createdAt` | datetime |

### 4.7 Respuestas API

- Éxito individual: `{ "data": T }`.
- Éxito paginado: `{ "data": T[], "meta": { "page", "pageSize", "total", "totalPages" } }`.
- Error: `{ "error": { "code", "message", "fieldErrors?", "details?" } }`.
- La API usa `401` para sesión ausente/expirada, `403` para falta de permiso,
  `404` para recurso no visible, `409` para conflicto de versión y `422` para
  validación.
- Las mutaciones de ticket envían `version`. Un `409` incluye la versión actual
  del ticket.

## 5. Arquitectura de componentes

### 5.1 Capas

- `app`: arranque, router, providers, layout y límites de error.
- `features`: comportamiento por dominio: autenticación, tickets, comentarios,
  dashboard, usuarios y etiquetas.
- `components`: componentes visuales compartidos sin reglas de dominio.
- `lib`: cliente HTTP, query client, fechas, validación y utilidades.
- `mocks`: handlers y datos de MSW.
- `types`: contratos compartidos cuando no pertenezcan a una feature.

Las features no importarán internals de otras features. La comunicación se hará
mediante componentes públicos, tipos compartidos, rutas o invalidación de
queries.

### 5.2 Árbol principal

```text
App
├── PublicLayout
│   └── LoginPage
└── AuthenticatedLayout
    ├── Sidebar
    ├── Topbar
    ├── DashboardPage
    ├── TicketsPage
    │   ├── TicketToolbar
    │   ├── TicketFilters
    │   ├── BoardView
    │   │   ├── StatusColumn
    │   │   └── TicketCard
    │   └── ListView
    │       └── TicketTable
    ├── TicketDetailPage
    │   ├── TicketHeader
    │   ├── TicketFields
    │   ├── CommentComposer
    │   ├── CommentList
    │   └── AuditTimeline
    ├── ArchivedTicketsPage
    └── AdminUsersPage
```

### 5.3 Rutas

| Ruta | Acceso | Contenido |
|---|---|---|
| `/login` | Público | Inicio de sesión con email y contraseña |
| `/dashboard` | Autenticado | Métricas según alcance |
| `/tickets` | Autenticado | Vista tablero/lista de tickets activos |
| `/tickets/:ticketId` | Con visibilidad | Detalle, comentarios y auditoría |
| `/archived` | Autenticado | Lista de tickets archivados visibles |
| `/admin/users` | Admin | Gestión de usuarios |
| `*` | Todos | Página no encontrada |

La ruta inicial autenticada será `/tickets`. La vista seleccionada y los filtros
se guardarán en query parameters.

### 5.4 Formularios y overlays

- Crear ticket: modal en escritorio y pantalla completa en móvil.
- Editar ticket: formulario dentro de la página de detalle.
- Archivar, restaurar y descartar cambios: diálogo de confirmación.
- Conflicto de concurrencia: diálogo bloqueante con opción de recargar la
  versión actual; el borrador se conserva en memoria para copiarlo manualmente.
- Los errores de campo aparecen junto al control. Los errores generales usan
  alerta en página; las confirmaciones breves usan toast.

## 6. Estructura de carpetas

```text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   ├── providers/
│   │   ├── router/
│   │   └── App.tsx
│   ├── components/
│   │   ├── feedback/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── comments/
│   │   ├── dashboard/
│   │   ├── labels/
│   │   ├── tickets/
│   │   └── users/
│   ├── lib/
│   │   ├── api/
│   │   ├── query/
│   │   ├── dates/
│   │   └── validation/
│   ├── mocks/
│   ├── styles/
│   ├── test/
│   ├── types/
│   └── main.tsx
├── e2e/
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

Cada feature contendrá, cuando aplique, `api`, `components`, `hooks`, `pages`,
`schemas`, `types` y pruebas colocadas junto al archivo probado.

## 7. Reglas de negocio

### 7.1 Visibilidad

- Admin: ve todos los tickets activos y archivados.
- Usuario: ve todos los tickets activos del equipo, además de los archivados que
  creó o que tiene asignados.
- Un recurso no visible se presenta como no encontrado, sin filtrar información.

### 7.2 Matriz de permisos

| Acción | Admin | Usuario |
|---|---:|---:|
| Crear ticket | Sí | Sí |
| Ver ticket visible | Sí | Sí |
| Editar cualquier campo activo | Sí | Solo si es creador |
| Cambiar estado | Sí | Solo si está asignado |
| Asignar o reasignar | Sí | No |
| Comentar ticket activo visible | Sí | Sí |
| Editar comentario | Cualquiera | Solo propio |
| Archivar | Cualquiera | Solo ticket propio no archivado |
| Restaurar | Sí | No |
| Ver auditoría | Sí | En tickets visibles |
| Gestionar usuarios/etiquetas | Sí | No |

Un ticket archivado es de solo lectura y no admite comentarios. Un ticket
`done` puede reabrirse por un admin o por su responsable. La condición de
creador no concede por sí sola permiso para cambiar estado.

### 7.3 Transiciones

- Estados activos y columnas: `todo`, `in_progress`, `review`, `blocked`,
  `done`, en ese orden fijo.
- Admin y responsable pueden mover un ticket desde cualquier estado activo a
  cualquier otro estado activo.
- Un usuario no asignado no puede moverlo.
- El tablero permite drag-and-drop y un selector accesible equivalente.
- La interfaz aplica el movimiento de forma optimista. Si la API lo rechaza,
  revierte la tarjeta, muestra el motivo e invalida la consulta.
- No existe la acción “agregar columna” mostrada en el prototipo.

### 7.4 Archivado

- La acción visible se llamará “Archivar”, no “Eliminar”.
- Archivar establece `archivedAt` y conserva `status`.
- Los archivados desaparecen de tablero, lista activa y métricas activas.
- Restaurar limpia `archivedAt` y recupera el estado conservado.
- La vista de archivados es una tabla, admite los filtros generales y no ofrece
  drag-and-drop.

### 7.5 Comentarios y menciones

- Los comentarios se ordenan de más antiguo a más reciente; en empate, por ID.
- Al escribir `@`, se muestra autocompletado de usuarios activos.
- Solo una selección válida crea una mención; texto con usuario inexistente no
  genera notificación.
- Menciones repetidas al mismo usuario en un comentario generan un solo evento.
- Mencionarse a uno mismo no genera email.
- El frontend no muestra entregas de email; solo confirma que el comentario fue
  guardado. La idempotencia pertenece al backend.
- Comentarios y auditoría se muestran en pestañas separadas.

### 7.6 Concurrencia

- Toda mutación de ticket incluye la `version` leída.
- Ante `409`, no se sobrescribe ni se reintenta automáticamente.
- El usuario debe recargar la versión actual antes de volver a guardar.
- Hay advertencia al cerrar pestaña o navegar con cambios sin guardar.
- Crear comentarios no usa actualización optimista; cambiar estado sí.
- No habrá polling general. TanStack Query refrescará al recuperar foco, al
  reconectar y después de mutaciones.

### 7.7 Filtros y búsqueda

- Filtros: estado, prioridad, responsable, creador, etiqueta, rango de creación
  y condición archivado.
- Los filtros se combinan con AND.
- La búsqueda es parcial sobre título, sin distinguir mayúsculas, con debounce
  de 300 ms.
- Lista y archivados usan paginación de 20 elementos.
- Orden inicial de lista: `updatedAt` descendente.
- Orden inicial de cada columna: prioridad alta a baja y luego `updatedAt`
  descendente.
- La URL conserva `view`, búsqueda, filtros, página y orden para permitir
  recargar o compartir la vista.

### 7.8 Dashboard

- El dashboard es distinto del tablero.
- Admin: métricas globales.
- Usuario: métricas de tickets creados por él o asignados a él.
- Tarjetas: total por estado, bloqueados y tiempo promedio de cierre.
- Gráficas: cerrados por mes en barras y activos por responsable en barras.
- Período fijo: últimos 12 meses, agrupado por mes calendario local.
- Tiempo de cierre: promedio de `closedAt - createdAt`, expresado en días y
  calculado solo con tickets actualmente en `done`.
- Los tickets sin responsable aparecen bajo “Sin asignar”.
- Pulsar una métrica navega a `/tickets` con filtros equivalentes cuando sea
  posible.

### 7.9 Gestión de usuarios

- Admin puede listar, crear, editar nombre/email/rol y activar o desactivar.
- No habrá registro público, invitaciones, recuperación ni cambio de contraseña
  en el frontend del MVP.
- No se permite desactivar al último administrador activo.
- Los usuarios inactivos no aparecen para nuevas asignaciones o menciones, pero
  siguen visibles en el historial.

## 8. Diseño, responsive y accesibilidad

- Interfaz en español; valores técnicos permanecen en inglés en la API.
- Fuente Inter cargada localmente para evitar dependencia de Google Fonts.
- Paleta, espaciado, radios y elevación siguen `stitch/DESIGN.md`.
- Desktop: sidebar fija de 240 px y tablero horizontal con columnas de mínimo
  280 px.
- Tablet: sidebar colapsable.
- Móvil, menor de 768 px: navegación tipo drawer y tablero como lista vertical
  con pestañas por estado; no hay drag-and-drop, se usa selector.
- Breakpoints: 640, 768, 1024, 1280 y 1536 px.
- Soporte: últimas dos versiones estables de Chrome, Edge, Firefox y Safari.
- Objetivo WCAG 2.1 AA: contraste, foco visible, etiquetas, manejo por teclado,
  regiones vivas para errores y alternativa accesible al drag-and-drop.
- Cada página tendrá estados de carga con skeleton, vacío con acción contextual,
  error recuperable, sin permiso y recurso no encontrado.

## 9. Sesión y errores

- Autenticación mediante cookie de sesión HTTP-only, `Secure` y `SameSite=Lax`.
- Login solicita email y contraseña.
- El frontend consulta `/auth/me` al iniciar.
- Un `401` limpia caché y redirige a `/login`, conservando la ruta de retorno.
- Un `403` muestra una página sin permiso.
- No se almacenan tokens en `localStorage` ni `sessionStorage`.
- Los reintentos automáticos se limitan a consultas con errores de red o `5xx`;
  nunca se reintentan automáticamente mutaciones ni errores `4xx`.

## 10. Calidad y aceptación

Comandos obligatorios:

```text
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:e2e
```

- TypeScript usará modo estricto.
- Se probarán permisos, validaciones, filtros, transiciones, archivado,
  comentarios, conflictos `409` y sesión expirada.
- Playwright cubrirá login, creación/edición, cambio de estado, comentario,
  archivado/restauración y dashboard por rol.
- Cobertura mínima: 80% de líneas, funciones, ramas y sentencias en `features`
  y `lib`.
- El build, typecheck, lint, pruebas unitarias y E2E críticas deben pasar.
- Variables públicas: `VITE_API_BASE_URL` y `VITE_ENABLE_MOCKS`.
- La aplicación se desplegará en `/` como archivos estáticos detrás de Nginx,
  con fallback de SPA hacia `index.html`.

## 11. Fuera de alcance

Además de lo indicado en el PRD: campana de notificaciones, menú de aplicaciones,
ayuda integrada, configuración general, selector de proyectos, miembros del
proyecto, creación de columnas, filtros guardados, rich text, imágenes subidas,
modo oscuro, internacionalización y persistencia de borradores.

## 12. Criterio de aprobación del frontend

El frontend se considera terminado cuando implementa todas las rutas, estados,
permisos y reglas de este documento; funciona con MSW y puede cambiar a la API
real solo mediante configuración; cumple los flujos E2E críticos; es usable con
teclado y responsive desde móvil hasta escritorio; y todos los comandos de
calidad terminan correctamente.
