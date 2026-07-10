import { expect, signIn, test } from "./fixtures.ts";

test.beforeEach(async ({ page }) => {
  await signIn(page, { demo: true });
  await page.goto("/");
});

test("starts with the demo song, credited", async ({ page }) => {
  const demo = page.getByRole("listitem").filter({ hasText: "Demo" });
  await expect(demo).toContainText("La");
  await expect(demo).toContainText("Lista");
  await demo.getByRole("link").click();
  await expect(page.getByRole("heading", { name: /La/ })).toBeVisible();
  await expect(page.getByText("Music: La by Shane Ivers")).toBeVisible();
  await expect(page).toHaveTitle("La · unmix");
});

test("plays the mix and toggles mute and solo", async ({ page }) => {
  await page.getByRole("listitem").filter({ hasText: "Demo" }).getByRole("link").click();
  const play = page.getByRole("button", { name: "Reproducir" });
  await expect(play).toBeEnabled({ timeout: 15_000 });
  await play.click();
  await expect(page.getByRole("button", { name: "Pausa" })).toBeVisible();
  await expect(page.getByText(/^0:0[1-9]/)).toBeVisible({ timeout: 10_000 });

  const mute = page.getByRole("button", { name: "Silenciar Voz" });
  await mute.click();
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  const solo = page.getByRole("button", { name: "Solo Batería" });
  await solo.click();
  await expect(solo).toHaveAttribute("aria-pressed", "true");

  await expect(page.getByRole("link", { name: "Descargar FLAC Voz" })).toHaveAttribute("href", /demo\/stems/);
});

test("rejects files that are not audio or video", async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
  await expect(page.getByRole("alert")).toContainText("Ese formato no está soportado");
});

test("switches language", async ({ page }) => {
  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your songs" })).toBeVisible();
  await page.getByRole("button", { name: "es", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tus canciones" })).toBeVisible();
});

test("deletes a song after confirming", async ({ page }) => {
  const demo = page.getByRole("listitem").filter({ hasText: "Demo" });
  await demo.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Todavía no hay canciones.")).toBeVisible();
});
