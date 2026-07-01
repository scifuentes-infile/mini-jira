import { afterEach, describe, expect, it } from "vitest";
import { mockApi } from "./api";
import { ApiError } from "../types/domain";

const baseTicket = {
  title: "Ticket creado desde pruebas",
  description: "Descripción válida para comprobar reglas del dominio.",
  priority: "medium" as const,
  assigneeId: "user-diego",
  labelIds: ["label-frontend"],
};

afterEach(async () => {
  await mockApi.logout();
});

describe("mockApi tickets", () => {
  it("crea tickets en estado todo con versión inicial", async () => {
    await mockApi.login("diego@minijira.test", "demo123");
    const ticket = await mockApi.createTicket(baseTicket);

    expect(ticket.status).toBe("todo");
    expect(ticket.version).toBe(1);
    expect(ticket.creator.id).toBe("user-diego");
  });

  it("impide que un usuario edite un ticket ajeno", async () => {
    await mockApi.login("diego@minijira.test", "demo123");

    await expect(
      mockApi.updateTicket("ticket-2", {
        ...baseTicket,
        title: "Intento no autorizado",
        version: 2,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("detecta una versión obsoleta sin sobrescribir", async () => {
    await mockApi.login("admin@minijira.test", "demo123");
    const ticket = await mockApi.createTicket(baseTicket);
    await mockApi.updateTicket(ticket.id, {
      ...baseTicket,
      title: "Primer cambio válido",
      version: ticket.version,
    });

    await expect(
      mockApi.updateTicket(ticket.id, {
        ...baseTicket,
        title: "Cambio con versión obsoleta",
        version: ticket.version,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("archiva lógicamente e impide nuevos comentarios", async () => {
    await mockApi.login("diego@minijira.test", "demo123");
    const ticket = await mockApi.createTicket(baseTicket);
    const archived = await mockApi.archiveTicket(ticket.id, ticket.version);

    expect(archived.archivedAt).not.toBeNull();
    await expect(
      mockApi.addComment(ticket.id, "No debe guardarse"),
    ).rejects.toMatchObject({ code: "ARCHIVED" });
  });

  it("solo permite restaurar al administrador", async () => {
    await mockApi.login("diego@minijira.test", "demo123");
    const ticket = await mockApi.createTicket(baseTicket);
    const archived = await mockApi.archiveTicket(ticket.id, ticket.version);

    await expect(
      mockApi.restoreTicket(archived.id, archived.version),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("reordena tickets dentro de una columna con posiciones estables", async () => {
    await mockApi.login("diego@minijira.test", "demo123");
    const first = await mockApi.createTicket({
      ...baseTicket,
      title: "Primer ticket para ordenar",
    });
    const second = await mockApi.createTicket({
      ...baseTicket,
      title: "Segundo ticket para ordenar",
    });

    const moved = await mockApi.reorderTicket(
      second.id,
      "todo",
      0,
      second.version,
    );
    const refreshedFirst = await mockApi.getTicket(first.id);

    expect(moved.position).toBe(0);
    expect(refreshedFirst.position).toBeGreaterThan(0);
  });
});
