# ADR-001 — Uso de Supabase en lugar de Firebase para el MVP de Mini Jira

## Estado

Aceptado

## Fecha

2026-06-03

## Contexto

Mini Jira es una herramienta interna de gestión de tickets para un equipo pequeño, aproximadamente 10 usuarios. El MVP debe permitir crear, visualizar, asignar, comentar, actualizar estados, archivar y restaurar tickets, además de ofrecer dashboard básico, notificaciones por email, trazabilidad mínima y control optimista de concurrencia.

El PRD define explícitamente que el sistema debe manejar reglas críticas como:

* Roles básicos: `admin` y `user`.
* Validación de permisos en backend.
* Tickets con estados controlados: `todo`, `in_progress`, `review`, `blocked`, `done`, `archived`.
* Archivado lógico en lugar de eliminación física.
* Restauración de tickets archivados solo por administrador.
* Comentarios con autor, fecha y menciones.
* Notificaciones por asignación, mención y cambio a estado `blocked`.
* Dashboard con métricas filtradas según permisos.
* Auditoría mínima de cambios críticos.
* Control optimista de concurrencia usando `version` o `updated_at`.

El modelo de datos esperado es claramente relacional, con entidades como:

* `users`
* `roles`
* `tickets`
* `comments`
* `ticket_audit_logs`
* `notification_events`

Además, el PRD recomienda PostgreSQL como base de datos por su soporte para transacciones, filtros, índices, consistencia, auditoría y consultas agregadas para dashboard.

Bajo este contexto, se evaluó si el MVP debía construirse sobre Firebase o Supabase.

## Opciones consideradas

### Opción 1 — Firebase

Firebase ofrece una plataforma backend administrada con servicios como Authentication, Firestore, Realtime Database, Hosting, Cloud Functions y Storage.

Firestore es una base de datos NoSQL orientada a documentos. A diferencia de una base de datos SQL, no utiliza tablas ni filas, sino documentos organizados en colecciones. Esto facilita ciertos casos de uso móviles, realtime y serverless, pero introduce mayor complejidad cuando el dominio requiere relaciones, filtros combinados, auditoría estructurada y reportes agregados.

Firebase también permite proteger datos mediante Cloud Firestore Security Rules o IAM, dependiendo del tipo de cliente y acceso.

#### Ventajas

* Muy rápido para prototipos.
* Buena integración con autenticación.
* Escalabilidad administrada.
* Buen soporte para realtime.
* Menor carga inicial de infraestructura.
* Ecosistema maduro de Google.

#### Desventajas para Mini Jira

* Firestore es NoSQL/documental, mientras que Mini Jira tiene un modelo naturalmente relacional.
* Las relaciones entre tickets, usuarios, roles, comentarios, auditoría y notificaciones serían menos directas.
* Los reportes del dashboard podrían requerir duplicación de datos o estructuras agregadas adicionales.
* Las reglas de autorización complejas pueden terminar distribuidas entre Security Rules, backend y estructura documental.
* El control optimista de concurrencia y la auditoría son posibles, pero menos naturales que en PostgreSQL.
* Las consultas combinadas por estado, prioridad, responsable, creador, etiquetas, fechas y archivado pueden volverse más rígidas por la forma de indexación y modelado documental.
* Mayor riesgo de diseñar el modelo alrededor de limitaciones de lectura/escritura en vez del dominio del negocio.

### Opción 2 — Supabase

Supabase es una plataforma basada en PostgreSQL que ofrece base de datos, autenticación, APIs automáticas, realtime, storage y funciones serverless. Supabase provee una base PostgreSQL completa por proyecto, con acceso a nivel de Postgres, backups administrados y extensiones.

Supabase también permite combinar Supabase Auth con Row Level Security de PostgreSQL para aplicar reglas de acceso directamente en la base de datos. La documentación oficial describe RLS como una primitiva de Postgres útil para proteger datos incluso cuando se accede mediante herramientas externas.

#### Ventajas

* Usa PostgreSQL, alineado con el PRD del MVP.
* Modelo relacional natural para tickets, usuarios, roles, comentarios, auditoría y notificaciones.
* Soporte fuerte para transacciones.
* Consultas SQL flexibles para filtros y dashboard.
* Índices adecuados para búsquedas por estado, prioridad, responsable, creador, fechas y etiquetas.
* Permite implementar control optimista con campo `version` o `updated_at`.
* Permite auditoría estructurada con tablas dedicadas.
* Row Level Security permite reforzar permisos a nivel de base de datos.
* Facilita migración futura a PostgreSQL autogestionado si el producto crece.
* Reduce la necesidad de duplicar datos para reportes básicos.
* Se integra bien con backend en Node.js/TypeScript, NestJS o Express.

#### Desventajas

* Requiere mayor conocimiento de SQL y diseño relacional.
* RLS puede ser mal configurado si no se diseña cuidadosamente.
* Para un MVP con backend propio, algunas capacidades automáticas de Supabase podrían no usarse directamente.
* La experiencia realtime de Firebase puede ser más directa en ciertos casos, aunque realtime no está dentro del alcance del MVP.
* Puede requerir más disciplina en migraciones, políticas y control de acceso.

## Decisión

Se decide utilizar **Supabase** como plataforma de backend administrado y base de datos principal para el MVP de Mini Jira, en lugar de Firebase.

La razón principal es que Mini Jira tiene un dominio claramente relacional y transaccional. El MVP necesita consistencia de datos, filtros combinados, auditoría, control optimista de concurrencia, permisos por rol y métricas agregadas. Estas necesidades encajan mejor con PostgreSQL que con un modelo documental NoSQL.

Supabase permite conservar la simplicidad de una plataforma administrada, pero sin abandonar PostgreSQL. Esto permite construir el MVP con menor fricción técnica respecto al modelo definido en el PRD.

La arquitectura recomendada será:

* **Frontend:** React + TypeScript + Material UI.
* **Backend API:** Node.js + TypeScript, preferiblemente NestJS.
* **Base de datos:** Supabase PostgreSQL.
* **Autenticación:** Supabase Auth o autenticación propia con sesiones/cookies HTTP-only.
* **Autorización:** Validación obligatoria en backend y, cuando aplique, Row Level Security en PostgreSQL.
* **Auditoría:** Tabla `ticket_audit_logs`.
* **Notificaciones:** Tabla `notification_events` y envío mediante SMTP/Nodemailer o proveedor transaccional.
* **Dashboard:** Consultas SQL agregadas sobre PostgreSQL.

Firebase queda descartado para este MVP porque su modelo documental no es el más adecuado para las reglas de negocio, relaciones, auditoría y consultas agregadas requeridas.

## Consecuencias positivas

### 1. Mejor alineación con el modelo de dominio

El sistema puede modelarse directamente con tablas relacionales:

```text
users
roles
tickets
comments
ticket_audit_logs
notification_events
```

Esto reduce la necesidad de estructuras duplicadas o documentos anidados difíciles de consultar.

### 2. Filtros más simples y potentes

Los filtros definidos en el PRD pueden resolverse con SQL:

* Estado.
* Prioridad.
* Responsable.
* Creador.
* Etiquetas.
* Fecha de creación.
* Archivado/no archivado.
* Búsqueda por título.

Esto facilita construir vistas de lista, tablero Kanban y dashboard sin rediseñar el modelo documental.

### 3. Mejor soporte para dashboard

Las métricas iniciales pueden calcularse directamente desde PostgreSQL:

* Total de tickets por estado.
* Tickets cerrados por mes.
* Tickets activos por usuario asignado.
* Tickets bloqueados.
* Tiempo desde creación hasta cierre.

Esto evita crear colecciones agregadas adicionales desde el inicio.

### 4. Auditoría más clara

Los cambios críticos pueden registrarse en una tabla estructurada:

```text
ticket_audit_logs
- id
- ticket_id
- user_id
- field
- old_value
- new_value
- created_at
```

Esto facilita trazabilidad, consultas históricas y depuración.

### 5. Concurrencia optimista más natural

El control de versión puede implementarse mediante SQL:

```sql
UPDATE tickets
SET status = 'done',
    version = version + 1,
    updated_at = NOW()
WHERE id = :ticket_id
  AND version = :current_version;
```

Si no se actualiza ninguna fila, el backend puede responder con conflicto `409 Conflict`.

### 6. Seguridad reforzada

Los permisos se validarán en backend y podrán reforzarse con Row Level Security en PostgreSQL. Esto evita depender únicamente de ocultar botones en frontend o de reglas distribuidas.

### 7. Menor lock-in conceptual

Aunque Supabase es una plataforma, la base sigue siendo PostgreSQL. Esto facilita una futura migración hacia:

* PostgreSQL autogestionado.
* AWS RDS.
* Google Cloud SQL.
* Azure Database for PostgreSQL.
* Otro proveedor compatible.

## Consecuencias negativas

### 1. Mayor responsabilidad en diseño de base de datos

El equipo deberá definir bien:

* Relaciones.
* Índices.
* Migraciones.
* Restricciones.
* Políticas de acceso.
* Estrategia de auditoría.

### 2. RLS puede aumentar la complejidad

Row Level Security es potente, pero puede complicar debugging si se mezcla sin criterio con la autorización del backend. Para el MVP, la recomendación es:

* Mantener la autorización principal en backend.
* Usar RLS como defensa adicional en tablas críticas.
* Documentar claramente cada política.

### 3. No se aprovechará Firebase Realtime

Firebase suele ser fuerte en experiencias realtime. Sin embargo, el PRD deja fuera del MVP la edición colaborativa en tiempo real y WebSockets, por lo que esta ventaja no es determinante.

### 4. Supabase no elimina la necesidad de backend

Aunque Supabase puede exponer APIs automáticas, Mini Jira necesita reglas de negocio claras, auditoría, validación de permisos y control de concurrencia. Por ello, se mantendrá una API backend propia.

## Decisiones derivadas

### 1. Usar PostgreSQL como fuente de verdad

Todas las entidades principales vivirán en Supabase PostgreSQL.

### 2. Mantener backend propio

El frontend no deberá escribir directamente sobre tablas críticas sin pasar por reglas controladas. El backend será responsable de:

* Validar permisos.
* Aplicar reglas de negocio.
* Detectar conflictos de concurrencia.
* Registrar auditoría.
* Generar eventos de notificación.

### 3. Implementar soft delete mediante `archived_at`

No se eliminarán tickets físicamente. La acción visual “Eliminar” actualizará:

```text
archived_at = now()
status = 'archived'
```

### 4. Implementar control optimista con `version`

Cada ticket tendrá un campo `version` entero. Toda edición crítica deberá enviar la versión actual conocida por el cliente.

### 5. Crear índices desde el MVP

Se recomiendan índices iniciales sobre:

```text
tickets.status
tickets.priority
tickets.assignee_id
tickets.creator_id
tickets.archived_at
tickets.created_at
tickets.closed_at
comments.ticket_id
ticket_audit_logs.ticket_id
notification_events.event_type
notification_events.ticket_id
```

### 6. Usar SQL para métricas del dashboard

El dashboard no requerirá un motor analítico separado durante el MVP.

## Alternativas descartadas

### Firebase con Firestore

Descartado por menor alineación con el modelo relacional, mayor complejidad para auditoría estructurada y posibles dificultades en reportes agregados.

### Firebase Realtime Database

Descartado porque el MVP no requiere colaboración realtime ni sincronización live compleja. Además, el modelo de datos sería menos adecuado para consultas relacionales y dashboard.

### PostgreSQL autogestionado desde el inicio

Descartado para el MVP porque Supabase reduce carga operativa inicial sin abandonar PostgreSQL.

### Backend completamente serverless sin API propia

Descartado porque el MVP requiere reglas de negocio, autorización, auditoría, concurrencia y notificaciones con suficiente control.

## Resultado esperado

Con Supabase, el equipo podrá construir un MVP más alineado al dominio real de Mini Jira, reduciendo complejidad accidental en el modelo de datos y conservando velocidad de desarrollo.

La decisión favorece:

* Consistencia.
* Seguridad.
* Auditoría.
* Consultas agregadas.
* Evolución futura.
* Menor riesgo técnico para permisos y concurrencia.

## Revisión futura

Esta decisión deberá revisarse si ocurre alguno de estos escenarios:

* El sistema requiere colaboración realtime intensiva.
* El producto cambia hacia una app móvil offline-first.
* Se necesita sincronización en tiempo real entre múltiples clientes como requisito principal.
* El equipo decide eliminar el backend propio y usar acceso directo desde cliente.
* El volumen de usuarios crece significativamente y exige rediseño de arquitectura.
* Se requiere integración profunda con ecosistema Google/Firebase.

Mientras el MVP mantenga las reglas actuales, Supabase es la opción recomendada.

