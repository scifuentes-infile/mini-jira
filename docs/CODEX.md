# Reglas globales del proyecto

Estas reglas aplican a todo el repositorio. Antes de implementar o modificar
funcionalidad, leer:

1. `frontend-specs.md`: contrato técnico y funcional del frontend.
2. `backlog.md`: historias de usuario y criterios de aceptación.
3. `stitch/DESIGN.md`: fuente canónica del sistema visual.

Si existe una contradicción funcional, prevalece `frontend-specs.md`, seguido de
`backlog.md`. Para decisiones visuales prevalece siempre `stitch/DESIGN.md`.

## Stack obligatorio

- React 19 con TypeScript estricto.
- Vite.
- Tailwind CSS 4.
- React Router para navegación.
- TanStack Query para estado remoto.
- React Hook Form y Zod para formularios y validación.
- No introducir otra librería de componentes o estado global sin necesidad
  demostrable y aprobación explícita.

## Regla estricta de colores

**NUNCA inventar colores.**

- Usar únicamente los colores declarados en la sección `colors` del frontmatter
  de `stitch/DESIGN.md`.
- Exponer esos colores como tokens semánticos de Tailwind y consumirlos mediante
  clases como `bg-primary`, `text-on-surface` y `border-outline-variant`.
- No usar paletas nativas de Tailwind como `blue-*`, `gray-*`, `slate-*`,
  `red-*`, `green-*`, `white` o `black`.
- No escribir colores arbitrarios en clases Tailwind, CSS, JSX, SVG o código:
  quedan prohibidos valores como `[#...]`, `rgb(...)`, `rgba(...)`,
  `hsl(...)`, nombres CSS y variables nuevas de color.
- No derivar aclarados, oscurecidos, gradientes ni transparencias de un color
  salvo que el resultado sea un token ya declarado en `stitch/DESIGN.md`.
- No usar opacidad para crear variantes cromáticas no definidas.
- Los estados, prioridades, texto, fondos, bordes, foco, error, iconos,
  gráficas, avatares y overlays deben mapearse a tokens existentes.
- Si un diseño requiere un color que no existe, detener la implementación y
  solicitar que se agregue primero a `stitch/DESIGN.md`.
- Las referencias cromáticas narrativas de `stitch/DESIGN.md` que no estén en
  su bloque `colors` no autorizan nuevos colores.

Los únicos tokens permitidos son:

```text
surface
surface-dim
surface-bright
surface-container-lowest
surface-container-low
surface-container
surface-container-high
surface-container-highest
on-surface
on-surface-variant
inverse-surface
inverse-on-surface
outline
outline-variant
surface-tint
primary
on-primary
primary-container
on-primary-container
inverse-primary
secondary
on-secondary
secondary-container
on-secondary-container
tertiary
on-tertiary
tertiary-container
on-tertiary-container
error
on-error
error-container
on-error-container
primary-fixed
primary-fixed-dim
on-primary-fixed
on-primary-fixed-variant
secondary-fixed
secondary-fixed-dim
on-secondary-fixed
on-secondary-fixed-variant
tertiary-fixed
tertiary-fixed-dim
on-tertiary-fixed
on-tertiary-fixed-variant
background
on-background
surface-variant
status-todo
status-in-progress
status-review
status-blocked
status-done
priority-high
priority-medium
priority-low
```

## Sistema visual

- Usar Inter exclusivamente.
- Respetar la escala tipográfica, espaciado y radios definidos en
  `stitch/DESIGN.md`; no crear valores arbitrarios si existe un token adecuado.
- Mantener estética corporativa, moderna, sobria y minimalista.
- Usar jerarquía mediante superficies tonales, espaciado y tipografía.
- El contenido principal tendrá un ancho máximo de 1440 px.
- En escritorio, las columnas Kanban tendrán un mínimo de 280 px y scroll
  horizontal.
- En móvil, el Kanban será una lista vertical con pestañas por estado.
- Todo componente debe cubrir estados de reposo, hover, foco, disabled, carga,
  vacío y error cuando correspondan.
- Mantener contraste WCAG 2.1 AA, foco visible y operación por teclado.

## Reglas funcionales críticas

- Nunca eliminar físicamente tickets; la acción de eliminación equivale a
  archivado lógico.
- Los tickets archivados son de solo lectura, no aparecen en vistas activas ni
  cuentan como activos en el dashboard.
- Solo administradores restauran tickets archivados.
- Los estados operativos son `todo`, `in_progress`, `review`, `blocked` y
  `done`.
- Un ticket nuevo inicia en `todo`.
- Solo el administrador o el responsable pueden reabrir un ticket `done`.
- Respetar permisos tanto en la interfaz como en las llamadas a la API. Ocultar
  un control nunca sustituye la autorización del backend.
- Enviar la versión vigente al modificar tickets y tratar `409 Conflict` sin
  sobrescribir cambios ajenos.
- No permitir comentarios ni modificaciones sobre tickets archivados.
- Mantener comentarios simultáneos y ordenarlos por fecha de creación.
- Detectar menciones con `@usuario`; asignaciones, menciones y bloqueos generan
  los eventos de notificación definidos en el backlog.
- Excluir datos no visibles para el usuario de listados, búsquedas, filtros y
  métricas.
- Registrar y mostrar la trazabilidad requerida para creación, estado,
  responsable, archivado, restauración y campos críticos.

## Arquitectura y datos

- Organizar por dominio dentro de `src/features`.
- Mantener componentes compartidos y sin lógica de dominio en `src/components`.
- Centralizar el cliente HTTP, Query Client, fechas y utilidades en `src/lib`.
- TanStack Query es la fuente de verdad para datos remotos.
- Mantener estado de filtros, búsqueda, vista, página y orden en la URL.
- No duplicar datos remotos en contextos ni stores.
- Validar formularios con esquemas Zod reutilizables.
- Usar tipos explícitos; evitar `any`, aserciones inseguras y estados
  imposibles.
- Adaptar nombres de la API en una capa dedicada; los componentes no deben
  depender del formato de transporte.

## Calidad de implementación

- Antes de editar, revisar patrones existentes y limitar el cambio al alcance
  solicitado.
- No añadir funcionalidades fuera de `frontend-specs.md` y `backlog.md`.
- No dejar controles decorativos sin comportamiento.
- No ocultar errores; mostrar mensajes claros y accionables.
- Incluir estados de carga, vacío, error, sin permiso y no encontrado.
- Toda interacción disponible con puntero debe tener alternativa por teclado.
- Añadir pruebas proporcionales al riesgo del cambio.
- Para reglas de permisos, archivado, estados y concurrencia, las pruebas son
  obligatorias.
- Antes de dar una tarea por terminada, ejecutar typecheck, lint y las pruebas
  afectadas.
- No modificar `stitch/DESIGN.md`, `backlog.md` ni `frontend-specs.md` para
  adaptar una implementación sin aprobación explícita.

## Criterio de detención

Detenerse y pedir aclaración cuando:

- Falte un color o token visual requerido.
- Una solicitud contradiga permisos, estados o criterios de aceptación.
- El contrato de la API no permita preservar concurrencia o autorización.
- La decisión implique ampliar el alcance del MVP.
