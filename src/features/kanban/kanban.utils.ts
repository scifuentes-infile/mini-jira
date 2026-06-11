import type { KanbanStatusDefinition, KanbanTask } from "./types";
import type { TicketStatus } from "../../types/domain";

export function groupKanbanTasks(
  tasks: KanbanTask[],
  columns: KanbanStatusDefinition[],
): Record<TicketStatus, KanbanTask[]> {
  return Object.fromEntries(
    columns.map((column) => [
      column.id,
      tasks
        .filter((task) => task.status === column.id)
        .sort((a, b) => a.position - b.position),
    ]),
  ) as Record<TicketStatus, KanbanTask[]>;
}

export function findTaskContainer(
  overId: string,
  tasks: KanbanTask[],
  columns: KanbanStatusDefinition[],
): TicketStatus | null {
  const column = columns.find((item) => item.id === overId);
  if (column) return column.id;
  return tasks.find((task) => task.id === overId)?.status ?? null;
}

export function moveKanbanTask(
  tasks: KanbanTask[],
  taskId: string,
  destinationStatus: TicketStatus,
  destinationIndex: number,
): KanbanTask[] {
  const active = tasks.find((task) => task.id === taskId);
  if (!active) return tasks;

  const sourceStatus = active.status;
  const source = tasks
    .filter((task) => task.id !== taskId && task.status === sourceStatus)
    .sort((a, b) => a.position - b.position);
  const target =
    sourceStatus === destinationStatus
      ? source
      : tasks
          .filter(
            (task) => task.id !== taskId && task.status === destinationStatus,
          )
          .sort((a, b) => a.position - b.position);
  const boundedIndex = Math.max(0, Math.min(destinationIndex, target.length));
  target.splice(boundedIndex, 0, {
    ...active,
    status: destinationStatus,
    position: boundedIndex,
  });

  const sourceIds = new Set(source.map((task) => task.id));
  const targetIds = new Set(target.map((task) => task.id));
  return tasks.map((task) => {
    const sourceIndex = source.findIndex((item) => item.id === task.id);
    if (sourceIds.has(task.id) && sourceStatus !== destinationStatus) {
      return { ...task, position: sourceIndex };
    }
    const targetIndex = target.findIndex((item) => item.id === task.id);
    if (targetIds.has(task.id)) {
      return {
        ...task,
        status: destinationStatus,
        position: targetIndex,
      };
    }
    return task;
  });
}
