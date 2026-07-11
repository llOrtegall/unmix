// Records a silent walkthrough for the client (phase 6): sign-in screen, demo
// song in the mixer, upload, live separation and the new song in the library.
// Usage (stack running, demo seeded): pnpm demo:record  ->  demo-recording/unmix-demo.mp4
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import { TEST_DOMAIN, testUserCli } from "../test/e2e/fixtures.ts";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const OUT = fileURLToPath(new URL("../demo-recording/", import.meta.url));
const SONG = fileURLToPath(new URL("../../../assets/demo/la.mp3", import.meta.url));
const size = { width: 1280, height: 800 };

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ slowMo: 120 });
const context = await browser.newContext({ viewport: size, locale: "es-CO", recordVideo: { dir: OUT, size } });
const page = await context.newPage();
const started = Date.now();
const at = () => (Date.now() - started) / 1000;
const pause = (ms: number) => page.waitForTimeout(ms);

// 1. Sign-in screen, then a user who already has the demo.
await page.goto(BASE);
await page.getByRole("button", { name: "Continuar con Google" }).waitFor();
await pause(2500);
const { cookie } = JSON.parse(testUserCli("sign-in", `demo-video@${TEST_DOMAIN}`, "--demo")) as { cookie: string };
const [name, value] = cookie.split("=") as [string, string];
await context.addCookies([{ name, value, url: BASE }]);
await page.reload();
await page.getByRole("heading", { name: "Tus canciones" }).waitFor();
await pause(2500);

// 2. The demo in the mixer: play, solo the vocals, bring the band back.
await page.getByRole("listitem").filter({ hasText: "Demo" }).getByRole("link").click();
await page.getByRole("button", { name: "Reproducir" }).click({ timeout: 15_000 });
await pause(5000);
await page.getByRole("button", { name: "Solo Voz" }).click();
await pause(5000);
await page.getByRole("button", { name: "Solo Voz" }).click();
await page.getByRole("button", { name: "Silenciar Batería" }).click();
await pause(4000);
await page.getByRole("button", { name: "Silenciar Batería" }).click();
await pause(2000);
await page.getByRole("button", { name: "Pausa" }).click();
await hover(page, "Descargar todo (ZIP)");

// 3. Upload a song and watch it separate (the wait is trimmed afterwards).
await page.getByRole("link", { name: "Biblioteca" }).click();
await pause(1500);
await page.locator('input[type="file"]').setInputFiles(SONG);
await page.getByText("Separando tu canción").waitFor({ timeout: 30_000 });
await pause(6000);
const cutFrom = at();
await page.getByRole("button", { name: "Reproducir" }).waitFor({ timeout: 240_000 });
const cutTo = at() - 4;
await pause(2000);
await page.getByRole("button", { name: "Reproducir" }).click();
await pause(5000);
await page.getByRole("button", { name: "Pausa" }).click();
await page.getByRole("link", { name: "Biblioteca" }).click();
await pause(3000);

await context.close();
await browser.close();
testUserCli("delete", TEST_DOMAIN);

// Playwright writes .webm; keep the walkthrough without the long Demucs wait.
const raw = OUT + readdirSync(OUT).find((f) => f.endsWith(".webm"))!;
renameSync(raw, OUT + "raw.webm");
const trim = `select='not(between(t,${cutFrom.toFixed(1)},${cutTo.toFixed(1)}))',setpts=N/FRAME_RATE/TB`;
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", OUT + "raw.webm", "-vf", trim, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT + "unmix-demo.mp4"]);
rmSync(OUT + "raw.webm");
console.log(`demo-recording/unmix-demo.mp4 (separation wait ${Math.round(cutTo - cutFrom)} s trimmed)`);

async function hover(p: Page, label: string) {
  await p.getByText(label).hover();
  await pause(1500);
}
