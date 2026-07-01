# Plan de desarrollo: componentes reutilizables del Kanban

## Objetivo

Separar el Kanban en componentes reutilizables con responsabilidades claras,
manteniendo reordenamiento interno, cambios entre estados, accesibilidad,
virtualización y actualización optimista.

## Árbol de dependencias

```text
TicketsPage
└── KanbanBoard
    ├── KanbanColumn
    │   └── TaskCard
    │       ├── Avatar
    │       ├── PriorityIcon
    │       └── tipos compartidos
    ├── dnd-kit
    ├── TanStack Virtual
    ├── utilidades de agrupación/movimiento
    └── tipos compartidos
```

## Fase 1: contratos y tipos compartidos

Archivo:

```text
frontend/src/features/kanban/types.ts
```

Tipos principales:

- `KanbanId`
- `KanbanTask`
- `KanbanStatusDefinition`
- `KanbanMoveInput`
- `TaskRenderOptions`
- `KanbanTaskRenderer`

`KanbanTask` contiene únicamente los datos necesarios para representar y mover
una tarea: identificador, clave, título, estado, prioridad, posición, etiquetas
y responsable.

## Fase 2: utilidades del dominio Kanban

Archivo:

```text
frontend/src/features/kanban/kanban.utils.ts
```

Responsabilidades:

- Agrupar tareas por columna.
- Ordenar tareas por `position`.
- Encontrar la columna asociada a una tarea o zona droppable.
- Reordenar dentro de una columna.
- Mover entre columnas.
- Normalizar posiciones de origen y destino.

Las utilidades no dependen de React ni de dnd-kit y deben probarse de forma
unitaria.

## Fase 3: TaskCard

Archivo:

```text
frontend/src/features/kanban/components/TaskCard.tsx
```

### Responsabilidad

Representar una tarea y exponer la interacción sortable.

### Props

```ts
interface TaskCardProps {
  task: KanbanTask;
  draggable?: boolean;
  selected?: boolean;
  compact?: boolean;
  href?: string;
  onOpen?: (task: KanbanTask) => void;
  onStatusChange?: (
    task: KanbanTask,
    status: TicketStatus,
  ) => void;
}
```

### Comportamiento

- Toda la tarjeta actúa como superficie de arrastre para puntero y touch.
- El botón con la clave funciona como activador accesible por teclado.
- `compact` se usa en `DragOverlay`.
- En móvil ofrece un selector alternativo de estado.
- Los enlaces y controles internos conservan su comportamiento normal.

### Variantes de prioridad

| Prioridad | Token |
|---|---|
| Alta | `priority-high` |
| Media | `priority-medium` |
| Baja | `priority-low` |

### Tokens

- Fondo: `surface-container-lowest`
- Hover: `surface-container-high`
- Borde: `outline-variant`
- Selección/arrastre: `primary`
- Foco: `primary-container`
- Título: `on-surface`, tipografía `headline-sm`
- Clave: `on-surface-variant`, tipografía `label-sm`
- Etiquetas: `secondary-container`, `on-secondary-container`, `label-sm`
- Usuario sin asignar: `outline`

## Fase 4: KanbanColumn

Archivo:

```text
frontend/src/features/kanban/components/KanbanColumn.tsx
```

### Responsabilidad

Representar una columna genérica para cualquier estado.

### Props

```ts
interface KanbanColumnProps {
  id: TicketStatus;
  title: string;
  tasks: KanbanTask[];
  visible?: boolean;
  virtualizeAfter?: number;
  emptyMessage?: string;
  canDragTask: (task: KanbanTask) => boolean;
  renderTask?: KanbanTaskRenderer;
  onMobileStatusChange?: (
    task: KanbanTask,
    status: TicketStatus,
  ) => void;
}
```

### Comportamiento

- Registra una zona `droppable` por estado.
- Implementa `SortableContext` vertical.
- Virtualiza al superar `virtualizeAfter`.
- Admite renderer personalizado.
- Puede ocultarse visualmente en móvil.
- Muestra mensaje para columnas vacías.

### Tokens

- Fondo: `surface-container-low`
- Borde: `outline-variant`
- Destino activo: `primary-fixed`, `primary`
- Encabezado: `on-surface-variant`, `label-md`
- Estado vacío: `on-surface-variant`, `body-md`
- Contadores: `status-todo`, `status-in-progress`, `status-review`,
  `status-blocked`, `status-done`, con `label-sm`

## Fase 5: KanbanBoard

Archivo:

```text
frontend/src/features/kanban/components/KanbanBoard.tsx
```

### Responsabilidad

Orquestar columnas, sensores, colisiones, estado optimista y persistencia.

### Props

```ts
interface KanbanBoardProps {
  tasks: KanbanTask[];
  columns: KanbanStatusDefinition[];
  canDragTask: (task: KanbanTask) => boolean;
  onMove: (input: KanbanMoveInput) => Promise<void>;
  initialMobileStatus?: TicketStatus;
  virtualizeAfter?: number;
  disabled?: boolean;
  renderTask?: KanbanTaskRenderer;
  onMoveError?: (
    error: unknown,
    task: KanbanTask,
  ) => void;
}
```

### Comportamiento

- Agrupa tareas según la configuración de columnas.
- Usa sensores de puntero, touch y teclado.
- Prioriza colisiones bajo el puntero.
- Mueve optimistamente entre columnas durante `onDragOver`.
- Reordena y persiste al completar `onDragEnd`.
- Revierte al snapshot previo si la persistencia falla.
- Conserva el último destino válido.
- Implementa `DragOverlay`.
- Emite anuncios accesibles.
- Presenta pestañas de estado en móvil.

### Tokens

- Canvas: `background`
- Pestaña activa: `primary`, `on-primary`
- Pestaña inactiva: `surface-container-lowest`, `primary`
- Bordes: `outline-variant`
- Overlay: `surface-container-lowest`, `primary`, `on-surface`
- Pestañas: `label-md`
- Overlay: `label-sm`, `headline-sm`

## Fase 6: integración

Archivo consumidor:

```text
frontend/src/features/tickets/TicketsPage.tsx
```

Responsabilidades de integración:

- Adaptar `Ticket[]` a `KanbanTask[]` mediante compatibilidad estructural.
- Definir las columnas y mensajes vacíos.
- Resolver permisos con `canDragTask`.
- Recuperar el `Ticket` completo para enviar `version` a la mutación.
- Mostrar confirmaciones y errores mediante toast.

El módulo se consume únicamente desde:

```ts
import {
  KanbanBoard,
  type KanbanTask,
} from "../kanban";
```

## Estructura final

```text
frontend/src/features/kanban/
├── components/
│   ├── KanbanBoard.tsx
│   ├── KanbanColumn.tsx
│   └── TaskCard.tsx
├── index.ts
├── kanban.utils.test.ts
├── kanban.utils.ts
└── types.ts
```

## Validación

- Render de prioridades, etiquetas y responsable.
- Columna vacía y con tareas.
- Reordenamiento dentro de una columna.
- Movimiento entre columnas.
- Arrastre desde cualquier parte de la tarjeta.
- Navegación y movimiento por teclado.
- Soporte touch y selector móvil.
- Reversión ante error de persistencia.
- Virtualización.
- Auditoría automática de colores.
- Typecheck, lint, pruebas unitarias, E2E y build.

## Restricción visual

No se permite inventar colores. Todos los componentes deben usar únicamente los
tokens definidos en `stitch/DESIGN.md` y expuestos mediante Tailwind.
