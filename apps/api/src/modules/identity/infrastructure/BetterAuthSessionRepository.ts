import { UserId } from "../../shared/domain/UserId.ts";
import type { SessionCookies } from "../domain/SessionCookies.ts";
import type { SessionRepository } from "../domain/SessionRepository.ts";
import type { BetterAuth } from "./createBetterAuth.ts";

export class BetterAuthSessionRepository implements SessionRepository {
  private readonly auth: BetterAuth;

  constructor(auth: BetterAuth) {
    this.auth = auth;
  }

  async findUserId(cookies: SessionCookies): Promise<UserId | null> {
    const session = await this.auth.api.getSession({ headers: new Headers({ cookie: cookies.toPrimitive() }) });
    return session ? UserId.fromPrimitive(session.user.id) : null;
  }

  handle(request: Request): Promise<Response> {
    return this.auth.handler(request);
  }
}
