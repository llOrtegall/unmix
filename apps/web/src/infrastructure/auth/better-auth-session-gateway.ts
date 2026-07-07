import { createAuthClient } from "better-auth/client";
import type { Outcome, SessionGateway } from "../../application/ports/index.ts";
import type { User } from "../../domain/user.ts";

/** Better Auth's browser client against /api/auth on the same origin (ADR 0025). */
export class BetterAuthSessionGateway implements SessionGateway {
  #client = createAuthClient({ basePath: "/api/auth" });
  #expired = new Set<() => void>();

  async current(): Promise<Outcome<User | null>> {
    const { data, error } = await this.#client.getSession();
    if (error) return { ok: false, error: toAppError(error) };
    if (!data) return { ok: true, value: null };
    const { id, name, email, image } = data.user;
    return { ok: true, value: { id, name, email, imageUrl: image ?? null } };
  }

  async signInWithGoogle(returnTo: string): Promise<Outcome<void>> {
    const { error } = await this.#client.signIn.social({
      provider: "google",
      callbackURL: returnTo,
      // Better Auth appends ?error=<code>; the sign-in page shows it.
      errorCallbackURL: "/",
    });
    return error ? { ok: false, error: toAppError(error) } : { ok: true, value: undefined };
  }

  async signOut(): Promise<Outcome<void>> {
    const { error } = await this.#client.signOut();
    return error ? { ok: false, error: toAppError(error) } : { ok: true, value: undefined };
  }

  onExpired(listener: () => void): () => void {
    this.#expired.add(listener);
    return () => this.#expired.delete(listener);
  }

  /** Called by the HTTP adapters on a 401. */
  expire(): void {
    for (const listener of this.#expired) listener();
  }
}

function toAppError(error: { status: number; code?: string; message?: string }) {
  if (error.status === 0) return { code: "NETWORK_ERROR", message: "" };
  return { code: error.code ?? "AUTH_ERROR", message: error.message ?? "" };
}
