import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import type { TicketStatus } from "../../../types/domain";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import {
  findTaskContainer,
  groupKanbanTasks,
  moveKanbanTask,
} from "../kanban.utils";
import type {
  KanbanMoveInput,
  KanbanStatusDefinition,
  KanbanTask,
  KanbanTaskRenderer,
} from "../types";

export interface KanbanBoardProps {
  tasks: KanbanTask[];
  columns: KanbanStatusDefinition[];
  canDragTask: (task: KanbanTask) => boolean;
  onMove: (input: KanbanMoveInput) => Promise<void>;
  initialMobileStatus?: TicketStatus;
  virtualizeAfter?: number;
  disabled?: boolean;
  renderTask?: KanbanTaskRenderer;
  onMoveError?: (error: unknown, task: KanbanTask) => void;
}

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args).filter(
    (collision) => collision.id !== args.active.id,
  );
  if (pointer.length) return pointer;
  const intersections = rectIntersection(args).filter(
    (collision) => collision.id !== args.active.id,
  );
  if (intersections.length) return intersections;
  return closestCorners(args).filter(
    (collision) => collision.id !== args.active.id,
  );
};

export function KanbanBoard({
  tasks,
  columns,
  canDragTask,
  onMove,
  initialMobileStatus,
  virtualizeAfter = 20,
  disabled = false,
  renderTask,
  onMoveError,
}: KanbanBoardProps) {
  const initialStatus = initialMobileStatus ?? columns[0]?.id ?? "todo";
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [mobileStatus, setMobileStatus] = useState<TicketStatus>(initialStatus);
  const snapshotRef = useRef<KanbanTask[]>(tasks);
  const originalTaskRef = useRef<KanbanTask | null>(null);
  const lastOverId = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Synchronize optimistic state when the remote query publishes new data.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrderedTasks(tasks), [tasks]);

  const grouped = useMemo(
    () => groupKanbanTasks(orderedTasks, columns),
    [columns, orderedTasks],
  );

  function findTask(id: string) {
    return orderedTasks.find((task) => task.id === id);
  }

  function destination(overIdValue: string | number | null | undefined) {
    if (overIdValue === null || overIdValue === undefined) return null;
    const overId = String(overIdValue);
    const status = findTaskContainer(overId, orderedTasks, columns);
    if (!status) return null;
    const overTask = orderedTasks.find((task) => task.id === overId);
    return {
      status,
      index: overTask
        ? grouped[status].findIndex((task) => task.id === overTask.id)
        : grouped[status].length,
    };
  }

  function handleDragStart(event: DragStartEvent) {
    const task = findTask(String(event.active.id));
    if (!task) return;
    snapshotRef.current = orderedTasks;
    originalTaskRef.current = { ...task };
    lastOverId.current = null;
    setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    if (!event.over) return;
    lastOverId.current = String(event.over.id);
    const active = findTask(String(event.active.id));
    const target = destination(event.over.id);
    if (!active || !target || active.status === target.status) return;

    setOrderedTasks((current) =>
      moveKanbanTask(current, active.id, target.status, target.index),
    );
    setActiveTask((current) =>
      current ? { ...current, status: target.status } : current,
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const originalTask = originalTaskRef.current;
    const target = destination(event.over?.id ?? lastOverId.current);
    setActiveTask(null);
    lastOverId.current = null;
    originalTaskRef.current = null;
    if (!originalTask || !target) {
      setOrderedTasks(snapshotRef.current);
      return;
    }

    const next = moveKanbanTask(
      orderedTasks,
      originalTask.id,
      target.status,
      target.index,
    );
    setOrderedTasks(next);
    const moved = next.find((task) => task.id === originalTask.id);
    if (!moved) return;

    try {
      await onMove({
        task: originalTask,
        sourceStatus: originalTask.status,
        destinationStatus: moved.status,
        destinationIndex: moved.position,
      });
      setMobileStatus(moved.status);
    } catch (error) {
      setOrderedTasks(snapshotRef.current);
      onMoveError?.(error, originalTask);
    }
  }

  async function moveFromSelector(task: KanbanTask, status: TicketStatus) {
    const snapshot = orderedTasks;
    const destinationIndex = grouped[status].length;
    setOrderedTasks(
      moveKanbanTask(orderedTasks, task.id, status, destinationIndex),
    );
    try {
      await onMove({
        task,
        sourceStatus: task.status,
        destinationStatus: status,
        destinationIndex,
      });
      setMobileStatus(status);
    } catch (error) {
      setOrderedTasks(snapshot);
      onMoveError?.(error, task);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      autoScroll
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={() => {
        setOrderedTasks(snapshotRef.current);
        setActiveTask(null);
        originalTaskRef.current = null;
        lastOverId.current = null;
      }}
      onDragEnd={(event) => void handleDragEnd(event)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Pulsa espacio para tomar la tarea. Usa las flechas para moverla, espacio para soltarla y escape para cancelar.",
        },
        announcements: {
          onDragStart({ active }) {
            const task = findTask(String(active.id));
            return task
              ? `Has tomado ${task.key}, ${task.title}.`
              : "Has tomado una tarea.";
          },
          onDragOver({ over }) {
            if (!over) return "Fuera de una zona válida.";
            const target = destination(over.id);
            const column = columns.find((item) => item.id === target?.status);
            return column ? `Sobre la columna ${column.label}.` : undefined;
          },
          onDragEnd({ over }) {
            return over ? "Movimiento finalizado." : "Movimiento cancelado.";
          },
          onDragCancel() {
            return "Movimiento cancelado.";
          },
        },
      }}
    >
      <div
        className="mb-4 flex gap-2 overflow-x-auto md:hidden"
        aria-label="Seleccionar estado visible"
      >
        {columns.map((column) => (
          <Button
            key={column.id}
            variant={mobileStatus === column.id ? "primary" : "secondary"}
            className="shrink-0"
            onClick={() => setMobileStatus(column.id)}
          >
            {column.label} ({grouped[column.id].length})
          </Button>
        ))}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.label}
            tasks={grouped[column.id]}
            visible={mobileStatus === column.id}
            virtualizeAfter={virtualizeAfter}
            emptyMessage={column.emptyMessage}
            canDragTask={(task) => !disabled && canDragTask(task)}
            renderTask={renderTask}
            onMobileStatusChange={(task, status) =>
              void moveFromSelector(task, status)
            }
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-80">
            <TaskCard task={activeTask} draggable={false} compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
