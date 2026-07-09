// Dev and test helper: signs a user in without Google by writing a Better Auth
// session straight to Postgres and signing its cookie (ADR 0025).
import { randomBytes } from "node:crypto";
import { makeSignature } from "better-auth/crypto";
import type pg from "pg";

/** Upserts the user, opens a one-hour session and returns its cookie header. */
export async function signInAs(db: pg.Client, email: string): Promise<{ userId: string; cookie: string }> {
  const { rows } = await db.query<{ id: string }>(
    `insert into users (name, email, email_verified) values ($1, $2, true)
     on conflict (email) do update set name = excluded.name returning id`,
    [email.split("@")[0], email],
  );
  const userId = rows[0]!.id;
  const token = randomBytes(24).toString("base64url");
  await db.query(`insert into sessions (user_id, token, expires_at) values ($1, $2, now() + interval '1 hour')`, [
    userId,
    token,
  ]);
  const signature = await makeSignature(token, process.env.BETTER_AUTH_SECRET!);
  return { userId, cookie: `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}` };
}
