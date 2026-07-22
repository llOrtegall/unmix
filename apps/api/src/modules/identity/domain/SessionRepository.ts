import type { UserId } from "../../shared/domain/UserId.ts";
import type { SessionCookies } from "./SessionCookies.ts";

export interface SessionRepository {
  findUserId(cookies: SessionCookies): Promise<UserId | null>;
  handle(request: Request): Promise<Response>;
}
