# Cobertura de Tests - Mini Jira

## Alcance auditado

- Backlog solicitado: `Specs-MiniJira/backlog.md`.
- Limitacion: la ruta solicitada no existe en el workspace; se uso como equivalente razonable `frontend/docs/backlog.md`. `frontend/docs/prd_hu.md` contiene el mismo set de HUs y escenarios Gherkin.
- Ruta de tests API solicitada: `apps/api/`.
- Limitacion: `apps/api/` no existe y no se encontraron tests propios bajo `backend/src`.
- Comandos de inspeccion solicitados usados: `find . -name '*.test.ts' -print` y `grep -R -n -E 'describe|it\(' frontend/src backend/src apps/api`.
- Tests propios encontrados y auditados:
  - `frontend/src/mocks/api.test.ts`
  - `frontend/src/features/kanban/kanban.utils.test.ts`
  - `frontend/src/lib/constants.test.ts`
- Nota: `find` tambien encontro muchos `*.test.ts` dentro de `node_modules`; se excluyen de la evaluacion por no pertenecer al producto.

Esta auditoria mide cobertura funcional observable en tests existentes. No se modificaron tests ni se crearon tests nuevos.

## Historias vs cobertura

| Historia | Estado | Evidencia de tests | Brecha principal |
| --- | --- | --- | --- |
| HU-01 - Gestionar tickets con permisos, estados y archivado logico | ⚠️ test parcial | `mockApi tickets` cubre creacion en `todo` con version inicial y creador; rechazo de edicion ajena; conflicto por version; archivado logico con `archivedAt`; bloqueo de comentario tras archivado; rechazo de restauracion por usuario no admin; reorder. `kanban utils` cubre agrupacion, orden y movimiento entre columnas. `estados del flujo` cubre el orden de `todo`, `in_progress`, `review`, `blocked`, `done`. | No hay test API/backend real. Faltan edicion permitida con auditoria, cambio de estado con auditoria, reapertura, rechazo de reapertura, bloqueo de edicion de archivados, restauracion exitosa por admin, desaparicion de archivados de vistas principales y persistencia de auditoria. |
| HU-02 - Colaborar en tickets mediante comentarios, menciones, notificaciones y control de concurrencia | ⚠️ test parcial | `mockApi tickets` cubre conflicto por version obsoleta y rechazo de comentario cuando el ticket ya fue archivado. | No hay cobertura de comentario valido, historial, autor/fecha, menciones, notificaciones, deduplicacion/idempotencia, asignacion de responsable, bloqueo, mensajes de usuario ni orden de comentarios simultaneos. |
| HU-03 - Consultar dashboard y tickets respetando permisos y datos activos | ❌ sin test | No se encontro ningun `describe`/`it` para dashboard, metricas, filtros, busqueda, listados por rol o vista secundaria de archivados. | Riesgo alto de metricas incorrectas, inclusion de archivados en trabajo activo o exposicion de datos fuera del alcance del usuario. |

## Edge cases del Gherkin sin test

### HU-01 - Gestion de tickets con permisos y archivado logico

- `Editar un ticket permitido`: sin test que confirme guardado, incremento de version y auditoria de campos modificados.
- `Cambiar estado de un ticket asignado`: sin test para cambios a `in_progress`, `review`, `blocked` o `done` con auditoria.
- `Reabrir un ticket finalizado`: sin test para reapertura desde `done` por admin o responsable asignado.
- `Impedir reapertura no autorizada`: sin test especifico de rechazo cuando un usuario no autorizado intenta reabrir un ticket `done`.
- `Restaurar ticket archivado`: cobertura parcial solo para rechazo de usuario no admin; falta restauracion exitosa por admin y auditoria.
- `Bloquear edicion de ticket archivado`: cobertura parcial de comentario rechazado, pero sin test de edicion de ticket archivado.
- `Archivar ticket usando la accion eliminar`: cobertura parcial de `archivedAt`; falta comprobar que no se elimina fisicamente, que deja de aparecer en vistas principales y que se registra auditoria.
- `Crear un ticket valido`: cobertura parcial de estado inicial, version y creador; falta validar responsable, fecha de creacion y evento de auditoria.
- `Rechazar edicion de ticket sin permisos`: cobertura parcial de `403`; falta afirmar que el ticket conserva sus valores anteriores.

### HU-02 - Colaboracion, notificaciones y concurrencia

- `Agregar comentario a un ticket visible`: sin test de comentario valido, autor, fecha ni aparicion en historial.
- `Detectar mencion en comentario`: sin test de parsing de `@usuario`, evento `user_mentioned` ni deduplicacion por reintentos.
- `Notificar asignacion de responsable`: sin test de actualizacion de responsable, auditoria y evento `ticket_assigned`.
- `Notificar cambio a estado bloqueado`: sin test de evento `ticket_blocked` al pasar a `blocked`.
- `Evitar notificaciones duplicadas`: sin test de idempotencia de eventos o trazabilidad de reintentos de correo.
- `Detectar conflicto por edicion concurrente`: cobertura parcial de rechazo por version obsoleta; falta validar mensaje de usuario y recarga de version reciente.
- `Impedir comentario en ticket archivado durante concurrencia`: cobertura parcial del rechazo `ARCHIVED`; falta modelar dos usuarios y validar mensaje informativo.
- `Conservar orden de comentarios simultaneos`: sin test de comentarios concurrentes, orden por fecha de creacion ni no sobrescritura.

### HU-03 - Dashboard y filtros con visibilidad por permisos

- `Administrador consulta dashboard global`: sin cobertura.
- `Usuario normal consulta dashboard limitado`: sin cobertura.
- `Excluir tickets archivados de metricas activas`: sin cobertura.
- `Contar ticket como cerrado`: sin cobertura.
- `Consultar tickets con filtros principales`: sin cobertura para estado, prioridad, responsable, creador, etiqueta, fecha de creacion o archivado.
- `Buscar tickets por titulo`: sin cobertura.
- `Consultar tickets archivados desde vista secundaria`: sin cobertura.

## Deuda tecnica de testing - Top 3

1. **Permisos y visibilidad sin tests API/backend reales**
   - Criticidad: alta para el negocio.
   - Riesgo: las reglas mas sensibles son autorizacion, alcance por rol y proteccion contra cambios no permitidos. Hoy la evidencia esta en mocks/frontend; no hay pruebas de endpoints reales que garanticen que el backend rechaza ediciones, reaperturas, restauraciones o listados no autorizados.

2. **Dashboard, filtros y aislamiento de datos sin cobertura**
   - Criticidad: alta para el negocio.
   - Riesgo: HU-03 esta completamente descubierta. Un error puede mezclar tickets entre usuarios, contar archivados como trabajo activo o mostrar metricas operativas falsas para admins y usuarios.

3. **Auditoria, notificaciones e idempotencia casi sin validacion**
   - Criticidad: media-alta para el negocio.
   - Riesgo: el PRD depende de trazabilidad y colaboracion. Faltan pruebas para eventos de auditoria, `ticket_assigned`, `ticket_blocked`, `user_mentioned`, prevencion de duplicados y trazabilidad de reintentos.
