import { describe, expect, it } from "vitest";
import type { KanbanStatusDefinition, KanbanTask } from "./types";
import { groupKanbanTasks, moveKanbanTask } from "./kanban.utils";

const columns: KanbanStatusDefinition[] = [
  { id: "todo", label: "Por hacer", emptyMessage: "Vacío" },
  { id: "in_progress", label: "En progreso", emptyMessage: "Vacío" },
];

const task = (
  id: string,
  status: "todo" | "in_progress",
  position: number,
): KanbanTask => ({
  id,
  key: id.toUpperCase(),
  title: id,
  status,
  priority: "medium",
  position,
  labels: [],
  assignee: null,
});

const tasks = [
  task("one", "todo", 0),
  task("two", "todo", 1),
  task("three", "in_progress", 0),
];

describe("kanban utils", () => {
  it("agrupa y ordena tareas por posición", () => {
    const grouped = groupKanbanTasks([...tasks].reverse(), columns);
    expect(grouped.todo.map((item) => item.id)).toEqual(["one", "two"]);
    expect(grouped.in_progress.map((item) => item.id)).toEqual(["three"]);
  });

  it("reordena dentro de la misma columna", () => {
    const moved = moveKanbanTask(tasks, "two", "todo", 0);
    const grouped = groupKanbanTasks(moved, columns);
    expect(grouped.todo.map((item) => item.id)).toEqual(["two", "one"]);
  });

  it("mueve entre columnas y normaliza ambas posiciones", () => {
    const moved = moveKanbanTask(tasks, "two", "in_progress", 0);
    const grouped = groupKanbanTasks(moved, columns);
    expect(grouped.todo.map((item) => [item.id, item.position])).toEqual([
      ["one", 0],
    ]);
    expect(grouped.in_progress.map((item) => [item.id, item.position])).toEqual(
      [
        ["two", 0],
        ["three", 1],
      ],
    );
  });
});
