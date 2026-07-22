import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { IdentityModule } from "../modules/identity/application/factory.ts";
import { identityRoutes } from "./identityRoutes.ts";

const appAnswering = (response: Response) => {
  const handleAuthRequest = vi.fn().mockResolvedValue(response);
  const app = Fastify().register(identityRoutes({ handleAuthRequest } as Partial<IdentityModule> as IdentityModule));
  return { app, handleAuthRequest };
};

const forwardedRequest = (handleAuthRequest: ReturnType<typeof vi.fn>): Request => handleAuthRequest.mock.calls[0]![0];

describe("identityRoutes", () => {
  it("forwards the request with its cookies and returns Better Auth's answer", async () => {
    const { app, handleAuthRequest } = appAnswering(Response.json({ user: { id: "u" } }));

    const response = await app.inject({ method: "GET", url: "/api/auth/get-session", headers: { cookie: "session=abc" } });

    const request = forwardedRequest(handleAuthRequest);
    expect(new URL(request.url).pathname).toBe("/api/auth/get-session");
    expect(request.headers.get("cookie")).toBe("session=abc");
    expect(response.json()).toEqual({ user: { id: "u" } });
  });

  it("forwards a JSON body", async () => {
    const { app, handleAuthRequest } = appAnswering(new Response(null, { status: 200 }));

    await app.inject({ method: "POST", url: "/api/auth/sign-in/social", payload: { provider: "google", callbackURL: "/" } });

    const request = forwardedRequest(handleAuthRequest);
    expect(request.method).toBe("POST");
    expect(await request.json()).toEqual({ provider: "google", callbackURL: "/" });
  });

  it("keeps every cookie Better Auth sets", async () => {
    const headers = new Headers();
    headers.append("set-cookie", "a=1; Path=/");
    headers.append("set-cookie", "b=2; Path=/");
    const { app } = appAnswering(new Response(null, { status: 302, headers }));

    const response = await app.inject({ method: "GET", url: "/api/auth/callback/google" });

    expect(response.statusCode).toBe(302);
    expect(response.headers["set-cookie"]).toEqual(["a=1; Path=/", "b=2; Path=/"]);
  });
});
