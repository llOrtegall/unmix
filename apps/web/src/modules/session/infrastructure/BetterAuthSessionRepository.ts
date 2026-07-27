import { createAuthClient } from "better-auth/client";
import { RequestFailedError } from "../../shared/domain/errors/RequestFailedError.ts";
import { SignInFailedError } from "../domain/errors/SignInFailedError.ts";
import type { SessionRepository } from "../domain/SessionRepository.ts";
import { User } from "../domain/User.ts";

// Better Auth sends the browser back with ?error=<code> when Google sign-in fails.
const ERROR_PARAM = "error";
const ERROR_RETURN_PATH = "/";
const PROVIDER = "google";

interface AuthClientError {
  readonly status: number;
}

/** Better Auth's browser client against /api/auth on the same origin (ADR 0025). */
export class BetterAuthSessionRepository implements SessionRepository {
  private readonly basePath: string;
  private readonly client: ReturnType<typeof createAuthClient>;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.client = createAuthClient({ basePath });
  }

  async findCurrentUser(): Promise<User | null> {
    const { data, error } = await this.client.getSession();
    if (error) throw this.failureOf(error);
    if (data) {
      const { id, name, email, image } = data.user;
      return User.fromPrimitive({ id, name, email, avatarUrl: image ?? null });
    }
    if (new URLSearchParams(location.search).has(ERROR_PARAM)) throw new SignInFailedError();
    return null;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.client.signIn.social({
      provider: PROVIDER,
      callbackURL: this.returnUrl(),
      errorCallbackURL: ERROR_RETURN_PATH,
    });
    if (error) throw this.failureOf(error);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.signOut();
    if (error) throw this.failureOf(error);
  }

  private returnUrl(): string {
    const params = new URLSearchParams(location.search);
    params.delete(ERROR_PARAM);
    const query = params.toString();
    return query ? `${location.pathname}?${query}` : location.pathname;
  }

  private failureOf(error: AuthClientError): RequestFailedError {
    return new RequestFailedError(this.basePath, error.status);
  }
}
