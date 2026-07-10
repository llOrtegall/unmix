import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { test, type Page } from "@playwright/test";

export const TEST_DOMAIN = "e2e.unmix.test";
const API_DIR = fileURLToPath(new URL("../../../api", import.meta.url));

/** Runs the API's test-user CLI with the repo's .env. */
export function testUserCli(...args: string[]): string {
  return execFileSync("node", ["--env-file=../../.env", "scripts/test-user.ts", ...args], { cwd: API_DIR, encoding: "utf8" });
}

/** Creates a fresh user, signs `page` in as them and returns their id. */
export async function signIn(page: Page, options: { demo?: boolean } = {}): Promise<string> {
  const email = `${randomUUID()}@${TEST_DOMAIN}`;
  const { userId, cookie } = JSON.parse(testUserCli("sign-in", email, ...(options.demo ? ["--demo"] : []))) as {
    userId: string;
    cookie: string;
  };
  const [name, value] = cookie.split("=") as [string, string];
  await page.context().addCookies([{ name, value, url: test.info().project.use.baseURL ?? "http://localhost:5173" }]);
  return userId;
}

export { expect, test } from "@playwright/test";
