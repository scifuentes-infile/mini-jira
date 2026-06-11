import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { TicketStatus } from "../../../types/domain";
import { TaskCard } from "./TaskCard";
import type { KanbanTask, KanbanTaskRenderer } from "../types";

export interface KanbanColumnProps {
  id: TicketStatus;
  title: string;
  tasks: KanbanTask[];
  visible?: boolean;
  virtualizeAfter?: number;
  emptyMessage?: string;
  canDragTask: (task: KanbanTask) => boolean;
  renderTask?: KanbanTaskRenderer;
  onMobileStatusChange?: (task: KanbanTask, status: TicketStatus) => void;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  visible = true,
  virtualizeAfter = 20,
  emptyMessage = "No hay tareas en este estado.",
  canDragTask,
  renderTask,
  onMobileStatusChange,
}: KanbanColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id,
    data: { type: "column", status: id },
  });
  // TanStack Virtual intentionally exposes mutable measurement functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 172,
    overscan: 4,
    enabled: tasks.length > virtualizeAfter,
  });
  const virtualized = tasks.length > virtualizeAfter;

  function taskNode(task: KanbanTask) {
    const draggable = canDragTask(task);
    return renderTask ? (
      renderTask(task, {
        draggable,
        onStatusChange: (status) => onMobileStatusChange?.(task, status),
      })
    ) : (
      <TaskCard
        task={task}
        draggable={draggable}
        href={`/tickets/${task.id}`}
        onStatusChange={onMobileStatusChange}
      />
    );
  }

  return (
    <section
      className={`${visible ? "block" : "hidden"} w-full shrink-0 md:block md:w-80`}
      aria-labelledby={`kanban-column-title-${id}`}
    >
      <header className="mb-3 flex items-center justify-between px-2">
        <h2
          id={`kanban-column-title-${id}`}
          className="text-label-md uppercase text-on-surface-variant"
        >
          {title}
        </h2>
        <StatusBadge status={id} count={tasks.length} />
      </header>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          data-testid={`kanban-column-${id}`}
          ref={(node) => {
            scrollRef.current = node;
            setDroppableRef(node);
          }}
          className={`min-h-[500px] max-h-[640px] overflow-y-auto rounded-xl border p-3 transition-colors ${
            isOver
              ? "border-primary bg-primary-fixed"
              : "border-outline-variant bg-surface-container-low"
          }`}
        >
          {virtualized ? (
            <div
              className="relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const task = tasks[virtualRow.index];
                if (!task) return null;
                return (
                  <div
                    key={task.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="absolute left-0 top-0 w-full pb-3"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {taskNode(task)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid content-start gap-3">
              {tasks.map((task) => (
                <div key={task.id}>{taskNode(task)}</div>
              ))}
            </div>
          )}
          {!tasks.length ? (
            <p className="p-8 text-center text-body-md text-on-surface-variant">
              {emptyMessage}
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
