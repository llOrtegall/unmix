import { expect, signIn, test } from "./fixtures.ts";

test("asks to sign in without a session", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Inicia sesión para empezar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeEnabled();
});

test("signs out back to the sign-in page", async ({ page }) => {
  await signIn(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tus canciones" })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
});

test("keeps each library private", async ({ browser }) => {
  const owner = await browser.newPage();
  await signIn(owner, { demo: true });
  await owner.goto("/");
  await owner.getByRole("link", { name: /La/ }).click();
  await expect(owner.getByRole("button", { name: "Reproducir" })).toBeVisible();
  const ownersTrack = owner.url();

  const stranger = await browser.newPage();
  await signIn(stranger);
  await stranger.goto("/");
  await expect(stranger.getByText("Todavía no hay canciones.")).toBeVisible();
  await stranger.goto(ownersTrack);
  await expect(stranger.getByText("Esta canción ya no existe.")).toBeVisible();
});
