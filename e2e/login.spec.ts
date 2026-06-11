import { expect, test } from "@playwright/test";

test("Home de escritorio integra layout, búsqueda, creación y Kanban accesible", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/tickets/);
  await expect(
    page.getByRole("heading", { name: "Trabajo del equipo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Buscar tickets" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Mover MJ-001/ }),
  ).toBeVisible();

  const handle = page.getByRole("button", { name: /Mover MJ-002/ });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
  await expect(page.getByText(/Ticket movido a/)).toBeVisible();

  const sourceColumn = page.getByTestId("kanban-column-todo");
  const sourceCard = sourceColumn.getByTestId("task-card-ticket-2");
  const targetColumn = page.getByTestId("kanban-column-in_progress");
  const handleBox = await sourceCard.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (handleBox && targetBox) {
    await page.mouse.move(
      handleBox.x + handleBox.width / 2,
      handleBox.y + handleBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + 420,
      { steps: 15 },
    );
    await page.mouse.up();
  }
  await expect(
    targetColumn.getByText("Diseñar la experiencia del inicio de sesión"),
  ).toBeVisible();
  await expect(page.getByText(/Ticket movido a En progreso/)).toBeVisible();

  await page.getByRole("button", { name: "Crear ticket" }).first().click();
  await expect(
    page.getByRole("dialog", { name: "Crear ticket" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();

  const search = page.getByRole("textbox", { name: "Buscar tickets" });
  await search.fill("correo");
  await search.press("Enter");
  await expect(page).toHaveURL(/search=correo/);
  await expect(page.getByText("Búsqueda: correo")).toBeVisible();
});

test("Home móvil usa drawer y una columna Kanban visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar navegación" }).click();

  await expect(
    page.getByRole("button", { name: /Por hacer \(2\)/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Por hacer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "En progreso" })).toBeHidden();
});
