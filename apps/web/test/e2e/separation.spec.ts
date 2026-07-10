import { fileURLToPath } from "node:url";
import { expect, signIn, test } from "./fixtures.ts";

const SONG = fileURLToPath(new URL("../../../../assets/demo/la.mp3", import.meta.url));

// Real Demucs run on CPU: about a minute and a half.
test("uploads a song, follows the separation and opens the mixer @slow", async ({ page }) => {
  test.setTimeout(300_000);
  await signIn(page);
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(SONG);
  await expect(page.getByText("Separando tu canción")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Reproducir" })).toBeVisible({ timeout: 240_000 });
  for (const stem of ["Voz", "Batería", "Bajo", "Guitarra", "Piano", "Otros"]) {
    await expect(page.getByRole("button", { name: `Silenciar ${stem}` })).toBeVisible();
  }
  await page.getByRole("link", { name: "Biblioteca" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "la" })).toContainText("Lista");
});
