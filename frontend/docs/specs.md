# PRD — Mini Jira

## 1. Resumen

Mini Jira es una herramienta interna de gestión de tickets para un equipo pequeño de aproximadamente 10 usuarios. El objetivo del MVP es permitir crear, visualizar, asignar, comentar, actualizar estados y archivar tickets, manteniendo control básico de permisos, trazabilidad mínima y prevención de pérdida de datos por ediciones concurrentes.

El producto debe ser simple, visualmente limpio y fácil de usar, pero sin sacrificar reglas críticas de permisos, consistencia de datos y auditoría.

---

## 2. Objetivo del producto

Construir una primera versión funcional que permita al equipo gestionar tareas internas sin depender de Jira u otra herramienta externa, priorizando:

- Flujo claro de tickets.
- Roles y permisos definidos.
- Estados consistentes.
- Comentarios y menciones.
- Notificaciones básicas por email.
- Dashboard inicial de métricas.
- Experiencia visual moderna y simple.

---

## 3. Usuarios y roles

### 3.1 Usuario normal

Puede trabajar con tickets operativos del equipo.

Permisos esperados:

- Crear tickets.
- Ver tickets propios, asignados y tickets visibles para el equipo.
- Editar tickets creados por él mientras no estén archivados.
- Comentar en tickets visibles.
- Cambiar estado de tickets asignados a él.
- Recibir notificaciones por asignación o mención.
- Archivar tickets creados por él, si no están cerrados por otra regla del sistema.

### 3.2 Administrador

Puede gestionar la operación general del sistema.

Permisos esperados:

- Ver todos los tickets.
- Crear, editar, asignar, reasignar y archivar cualquier ticket.
- Restaurar tickets archivados.
- Ver dashboard global.
- Gestionar usuarios.
- Cambiar estados de cualquier ticket.
- Consultar trazabilidad básica de cambios.

### 3.3 Reglas generales de permisos

- Ningún usuario debe eliminar físicamente tickets desde el MVP.
- La acción visual “Eliminar” deberá comportarse como “Archivar”.
- Los tickets archivados no deben aparecer en vistas principales.
- Los tickets archivados deben poder consultarse desde una vista secundaria.
- Solo administradores pueden restaurar tickets archivados.
- Los permisos del dashboard deben respetar el rol del usuario.

---

## 4. In-Scope

### 4.1 Autenticación y acceso

Incluido en el MVP:

- Login de usuarios.
- Roles básicos: `admin` y `user`.
- Protección de rutas según rol.
- Sesión autenticada.
- Logout.
- Validación de permisos en backend, no solo en frontend.

No se debe depender únicamente de ocultar botones en la interfaz.

---

### 4.2 Gestión de tickets

Incluido en el MVP:

- Crear ticket.
- Editar ticket.
- Ver detalle de ticket.
- Listar tickets.
- Filtrar tickets.
- Asignar responsable.
- Cambiar estado.
- Archivar ticket.
- Restaurar ticket solo por administrador.

Campos mínimos del ticket:

- `id`
- `title`
- `description`
- `status`
- `priority`
- `labels`
- `creator_id`
- `assignee_id`
- `created_at`
- `updated_at`
- `closed_at`
- `archived_at`
- `version`

Estados mínimos:

- `todo`
- `in_progress`
- `review`
- `blocked`
- `done`
- `archived`

Reglas:

- Un ticket en `done` puede reabrirse únicamente por administrador o por el usuario asignado.
- Un ticket archivado no puede editarse.
- Un ticket archivado no debe contarse como activo en el dashboard.
- El estado `blocked` debe existir para evitar distorsión en métricas de trabajo en progreso.
- El estado `review` debe existir para separar trabajo técnico terminado de trabajo validado.

---

### 4.3 Comentarios

Incluido en el MVP:

- Agregar comentarios a tickets.
- Ver historial de comentarios.
- Registrar autor y fecha.
- Detectar menciones simples usando formato `@usuario`.
- Enviar email cuando un usuario sea mencionado.

Campos mínimos del comentario:

- `id`
- `ticket_id`
- `author_id`
- `body`
- `created_at`
- `updated_at`

Reglas:

- Los comentarios no se eliminarán físicamente en el MVP.
- La edición de comentarios puede quedar limitada al autor y al administrador.
- Las menciones deben generar notificación por email.

---

### 4.4 Notificaciones por email

Incluido en el MVP:

- Email cuando un usuario es asignado a un ticket.
- Email cuando un usuario es mencionado en un comentario.
- Email cuando un ticket asignado cambia a `blocked`.

Requisitos:

- Usar servicio SMTP o proveedor transaccional.
- Usar plantillas básicas de correo.
- Evitar duplicados por reintentos.
- Registrar evento de notificación enviada.

Eventos mínimos:

- `ticket_assigned`
- `user_mentioned`
- `ticket_blocked`

---

### 4.5 Dashboard inicial

Incluido en el MVP:

- Total de tickets por estado.
- Tickets cerrados por mes.
- Tickets activos por usuario asignado.
- Tickets bloqueados.
- Tiempo básico desde creación hasta cierre.

Reglas:

- Administradores ven métricas globales.
- Usuarios normales ven métricas relacionadas con sus tickets o tickets visibles.
- Los tickets archivados no deben contarse como activos.
- Un ticket se considera cerrado cuando pasa a `done`.

---

### 4.6 Filtros y búsqueda

Incluido en el MVP:

- Filtrar por estado.
- Filtrar por prioridad.
- Filtrar por responsable.
- Filtrar por creador.
- Filtrar por etiqueta.
- Filtrar por fecha de creación.
- Filtrar por tickets archivados/no archivados.
- Búsqueda por título.

---

### 4.7 Concurrencia

Incluido en el MVP:

- Control optimista de concurrencia usando campo `version` o `updated_at`.
- Si dos usuarios editan el mismo ticket, el sistema debe detectar conflicto.
- El último guardado no debe sobrescribir silenciosamente cambios previos.
- El usuario debe recibir mensaje indicando que el ticket fue modificado por otra persona.
- El usuario debe poder recargar la versión más reciente antes de guardar.

Casos que deben cubrirse:

- Dos usuarios editan descripción al mismo tiempo.
- Un usuario cambia estado mientras otro edita campos del ticket.
- Un usuario archiva un ticket mientras otro intenta comentar.
- Dos usuarios reasignan el mismo ticket.
- Dos comentarios enviados casi al mismo tiempo deben conservar orden por fecha de creación.

---

### 4.8 Auditoría mínima

Incluido en el MVP:

- Registrar cambios importantes en ticket.
- Registrar quién hizo el cambio.
- Registrar fecha y hora.
- Registrar campo modificado.
- Registrar valor anterior y valor nuevo para cambios críticos.

Eventos auditables mínimos:

- Creación de ticket.
- Cambio de estado.
- Cambio de responsable.
- Archivado.
- Restauración.
- Cambio de prioridad.
- Cambio de título.
- Cambio de descripción.

---

### 4.9 UI/UX

Incluido en el MVP:

- Interfaz web responsive para escritorio.
- Estética limpia, moderna y minimalista.
- Tablero tipo columnas.
- Vista de lista/tablero.
- Formulario simple de creación y edición.
- Mensajes claros de error.
- Indicadores visuales de estado y prioridad.
- Modo oscuro si no compromete el plazo del MVP.

Criterios visuales:

- Diseño sobrio.
- Espaciado amplio.
- Componentes reutilizables.
- Evitar sobrecargar la pantalla.
- No sacrificar estados necesarios por estética.

---

## 5. Out-Scope

Queda fuera del MVP:

- Eliminación física de tickets.
- Roles avanzados o permisos configurables por pantalla.
- Flujos de aprobación complejos.
- Automatizaciones tipo reglas de negocio configurables.
- Adjuntos en tickets.
- Subtareas.
- Épicas, sprints o backlogs avanzados.
- Integración con Jira real.
- Integración con Slack, Teams u otras plataformas.
- WebSockets o edición colaborativa en tiempo real.
- Bloqueo pesimista de edición.
- Reportería avanzada.
- Exportación a Excel/PDF.
- Campos personalizados configurables por usuario.
- Multiempresa o multiorganización.
- Aplicación móvil nativa.
- App offline.
- Personalización avanzada de temas.
- Sistema completo de diseño propio.
- Analítica histórica compleja.
- Gestión avanzada de plantillas de email.
- Múltiples idiomas.

---

## 6. Stack Tecnológico

### 6.1 Frontend

Recomendado:

- React
- TypeScript
- Material UI
- React Router
- React Hook Form
- Zod para validaciones
- TanStack Query para manejo de datos remotos

Justificación:

- React y Material UI permiten construir una interfaz moderna rápidamente.
- TypeScript reduce errores en modelos como tickets, roles y estados.
- TanStack Query facilita sincronización, caché, refetch y estados de carga.
- Zod permite compartir reglas de validación con backend si se estructura correctamente.

---

### 6.2 Backend

Recomendado:

- Node.js
- TypeScript
- Express o NestJS

Opción preferida:

- NestJS si se busca estructura más formal.
- Express si se prioriza velocidad y simplicidad.

Justificación:

- Node.js fue mencionado como base técnica.
- TypeScript ayuda a mantener consistencia con frontend.
- NestJS ordena módulos como tickets, usuarios, comentarios, notificaciones y dashboard.

---

### 6.3 Base de datos

Recomendado:

- PostgreSQL

Justificación:

- Modelo relacional adecuado para usuarios, roles, tickets, comentarios, estados e historial.
- Buen soporte para transacciones.
- Buen rendimiento para filtros.
- Permite índices por estado, responsable, fechas y prioridad.
- Facilita auditoría y consistencia.

Tablas mínimas:

- `users`
- `roles`
- `tickets`
- `comments`
- `ticket_audit_logs`
- `notification_events`

---

### 6.4 ORM

Recomendado:

- Prisma

Justificación:

- Buen soporte TypeScript.
- Migraciones claras.
- Modelo declarativo.
- Acelera desarrollo del MVP.
- Reduce riesgo frente a consultas manuales mal estructuradas.

---

### 6.5 Autenticación

Recomendado para MVP:

- JWT con refresh token o sesión basada en cookies HTTP-only.

Preferencia:

- Cookies HTTP-only si el sistema será web interno.
- JWT si se prevé consumo futuro desde otros clientes.

Requisitos:

- Password hashing con bcrypt o argon2.
- Middleware de autorización por rol.
- Validación backend de permisos.

---

### 6.6 Email

Recomendado:

- SMTP corporativo o proveedor transaccional.
- Nodemailer para MVP.

Requisitos:

- Plantillas simples.
- Cola o tabla de eventos para evitar duplicados.
- Registro de emails enviados o fallidos.

---

### 6.7 Dashboard

Recomendado:

- Consultas agregadas desde PostgreSQL para MVP.
- Gráficas con Recharts o MUI X Charts.

No se recomienda para MVP:

- Motor analítico separado.
- Data warehouse.
- ETL externo.

---

### 6.8 Infraestructura

Recomendado:

- Docker para entorno local.
- Docker Compose con:
  - frontend
  - backend
  - PostgreSQL
  - servicio de email local opcional como Mailhog

Producción:

- Servidor interno o VPS.
- Nginx como reverse proxy.
- HTTPS.
- Variables de entorno para secretos.
- Backups automáticos de PostgreSQL.

---

## 7. Reglas de negocio críticas

1. Ningún ticket se elimina físicamente en el MVP.
2. La acción “Eliminar” equivale a archivar.
3. Solo administradores pueden restaurar tickets archivados.
4. Los cambios de estado deben quedar auditados.
5. Los cambios de responsable deben quedar auditados.
6. Los emails no deben duplicarse ante reintentos.
7. La concurrencia debe manejarse con control optimista.
8. Un usuario no debe sobrescribir cambios ajenos sin advertencia.
9. Los tickets bloqueados deben tener estado propio.
10. El dashboard debe respetar permisos.

---

## 8. Criterios de aceptación principales

### Tickets

- Dado un usuario autenticado, cuando crea un ticket con campos válidos, entonces el ticket queda registrado con estado inicial `todo`.
- Dado un usuario sin permisos sobre un ticket, cuando intenta editarlo, entonces el backend rechaza la operación.
- Dado un ticket archivado, cuando un usuario intenta editarlo, entonces el sistema bloquea la edición.
- Dado un ticket en `done`, cuando se consulta el dashboard, entonces cuenta como cerrado.

### Comentarios

- Dado un ticket visible para el usuario, cuando agrega un comentario, entonces queda registrado con autor y fecha.
- Dado un comentario con `@usuario`, cuando se guarda, entonces se genera una notificación por email.

### Concurrencia

- Dado que dos usuarios abren el mismo ticket, cuando uno guarda primero y el otro intenta guardar después, entonces el sistema detecta conflicto y evita sobrescritura silenciosa.

### Dashboard

- Dado un administrador, cuando abre el dashboard, entonces ve métricas globales.
- Dado un usuario normal, cuando abre el dashboard, entonces ve métricas limitadas a su alcance.

### Archivado

- Dado un usuario con permiso, cuando presiona “Eliminar”, entonces el ticket se archiva y no se borra físicamente.
- Dado un ticket archivado, cuando un administrador lo restaura, entonces vuelve a aparecer en las vistas activas.

---

## 9. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| Alcance demasiado amplio para 3 semanas | Alto | Priorizar MVP y dejar fuera funciones avanzadas |
| Permisos ambiguos | Alto | Definir matriz de permisos antes de desarrollo |
| Pérdida de datos por concurrencia | Alto | Implementar control optimista |
| Métricas incorrectas por estados insuficientes | Medio/Alto | Incluir `review` y `blocked` desde el inicio |
| Emails duplicados o fallidos | Medio | Registrar eventos de notificación |
| Diseño visual sobre funcionalidad crítica | Medio | Usar librería de componentes y no crear diseño desde cero |

---

## 10. Supuestos

- El sistema será usado inicialmente por un equipo interno de aproximadamente 10 personas.
- No se requiere multiempresa.
- No se requiere integración con herramientas externas en el MVP.
- El sistema será web.
- Los usuarios aceptan una primera versión con funcionalidad esencial antes de funcionalidades avanzadas.
- El dashboard inicial puede calcularse directamente desde PostgreSQL.
- El modo oscuro es deseable, pero no debe desplazar permisos, datos o concurrencia.

---

## 11. Prioridad MVP

### Must Have

- Login.
- Roles `admin` y `user`.
- CRUD lógico de tickets.
- Archivado en lugar de eliminación física.
- Estados `todo`, `in_progress`, `review`, `blocked`, `done`, `archived`.
- Comentarios.
- Asignación de responsable.
- Filtros principales.
- Control optimista de concurrencia.
- Dashboard básico.
- Notificaciones por email para asignación y mención.

### Should Have

- Modo oscuro.
- Restauración de tickets archivados.
- Auditoría visible desde UI.
- Métrica de tiempo promedio de cierre.
- Plantillas básicas de email.

### Could Have

- Vista Kanban más elaborada.
- Gráficas más avanzadas.
- Personalización visual.
- Filtros combinados avanzados.

### Won’t Have en MVP

- Adjuntos.
- Subtareas.
- WebSockets.
- Integraciones externas.
- App móvil.
- Reportes exportables.
- Permisos configurables dinámicamente.
