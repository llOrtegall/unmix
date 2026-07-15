import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { Identity } from "../modules/identity/index.ts";
import * as UserIdMother from "../modules/shared/test/helpers/UserIdMother.ts";
import { requireUser } from "./requireUser.ts";

const identityWith = (userId: string | null): Identity => ({
  handler: vi.fn(),
  currentUserId: vi.fn().mockResolvedValue(userId),
});

const appGuardedBy = (identity: Identity) =>
  Fastify()
    .addHook("preHandler", requireUser(identity))
    .get("/me", async (request) => ({ userId: request.userId }));

describe("requireUser", () => {
  it("exposes the signed-in user's id to the route", async () => {
    const userId = UserIdMother.createPrimitive();

    const response = await appGuardedBy(identityWith(userId)).inject({ method: "GET", url: "/me" });

    expect(response.json()).toEqual({ userId });
  });

  it("passes the request cookies to the identity provider", async () => {
    const identity = identityWith(UserIdMother.createPrimitive());

    await appGuardedBy(identity).inject({ method: "GET", url: "/me", headers: { cookie: "session=abc" } });

    expect(vi.mocked(identity.currentUserId).mock.calls[0]?.[0].get("cookie")).toBe("session=abc");
  });

  it("responds 401 without a session", async () => {
    const response = await appGuardedBy(identityWith(null)).inject({ method: "GET", url: "/me" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "session.required" });
  });
});
