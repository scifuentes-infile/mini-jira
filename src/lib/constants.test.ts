import { describe, expect, it } from "vitest";
import { statusLabels, ticketStatuses } from "./constants";

describe("estados del flujo", () => {
  it("mantiene las cinco columnas en el orden aprobado", () => {
    expect(ticketStatuses).toEqual([
      "todo",
      "in_progress",
      "review",
      "blocked",
      "done",
    ]);
  });

  it("tiene etiquetas visibles para todos los estados", () => {
    ticketStatuses.forEach((status) => {
      expect(statusLabels[status]).toBeTruthy();
    });
  });
});
