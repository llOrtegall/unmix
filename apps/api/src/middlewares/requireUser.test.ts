import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { IdentityModule } from "../modules/identity/application/factory.ts";
import type { UserId } from "../modules/shared/domain/UserId.ts";
import * as UserIdMother from "../modules/shared/test/helpers/UserIdMother.ts";
import { requireUser } from "./requireUser.ts";

const identityWith = (userId: UserId | null) => ({ findSessionUser: vi.fn().mockResolvedValue(userId) });

const appGuardedBy = (identity: Partial<IdentityModule>) =>
  Fastify()
    .addHook("preHandler", requireUser(identity as IdentityModule))
    .get("/me", async (request) => ({ userId: request.userId }));

describe("requireUser", () => {
  it("exposes the signed-in user's id to the route", async () => {
    const userId = UserIdMother.create();

    const response = await appGuardedBy(identityWith(userId)).inject({ method: "GET", url: "/me" });

    expect(response.json()).toEqual({ userId: userId.toPrimitive() });
  });

  it("looks the session up from the request cookies", async () => {
    const identity = identityWith(UserIdMother.create());

    await appGuardedBy(identity).inject({ method: "GET", url: "/me", headers: { cookie: "session=abc" } });

    expect(identity.findSessionUser).toHaveBeenCalledWith("session=abc");
  });

  it("responds 401 without a session", async () => {
    const response = await appGuardedBy(identityWith(null)).inject({ method: "GET", url: "/me" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "session.required" });
  });
});
