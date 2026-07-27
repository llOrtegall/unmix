import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestFailedError } from "../../../shared/domain/errors/RequestFailedError.ts";
import { httpGet } from "../../../shared/infrastructure/http.ts";
import { SignInFailedError } from "../../domain/errors/SignInFailedError.ts";
import { BetterAuthSessionRepository } from "../../infrastructure/BetterAuthSessionRepository.ts";
import { HttpSessionExpiryRepository } from "../../infrastructure/HttpSessionExpiryRepository.ts";
import * as UserMother from "../helpers/UserMother.ts";

const client = vi.hoisted(() => ({
  getSession: vi.fn(),
  signIn: { social: vi.fn() },
  signOut: vi.fn(),
}));

vi.mock("better-auth/client", () => ({ createAuthClient: () => client }));

describe("BetterAuthSessionRepository", () => {
  const repository = new BetterAuthSessionRepository("/api/auth");

  beforeEach(() => window.history.replaceState(null, "", "/tracks/1"));

  it("maps the signed-in user", async () => {
    const { id, name, email, avatarUrl } = UserMother.createPrimitive();
    client.getSession.mockResolvedValue({ data: { user: { id, name, email, image: avatarUrl } }, error: null });

    expect((await repository.findCurrentUser())?.toPrimitive()).toEqual({ id, name, email, avatarUrl });
  });

  it("finds nobody without a session", async () => {
    client.getSession.mockResolvedValue({ data: null, error: null });

    expect(await repository.findCurrentUser()).toBeNull();
  });

  it("reports a failed Google sign-in from the URL", async () => {
    client.getSession.mockResolvedValue({ data: null, error: null });
    window.history.replaceState(null, "", "/?error=access_denied");

    await expect(repository.findCurrentUser()).rejects.toThrow(SignInFailedError);
  });

  it("turns client errors into request failures", async () => {
    client.getSession.mockResolvedValue({ data: null, error: { status: 0 } });
    client.signOut.mockResolvedValue({ error: { status: 500 } });

    await expect(repository.findCurrentUser()).rejects.toMatchObject({ code: "request.network" });
    await expect(repository.signOut()).rejects.toBeInstanceOf(RequestFailedError);
  });

  it("comes back to the current page without the previous error", async () => {
    client.signIn.social.mockResolvedValue({ error: null });
    window.history.replaceState(null, "", "/tracks/1?error=access_denied&tab=mix");

    await repository.signInWithGoogle();

    expect(client.signIn.social).toHaveBeenCalledWith({ provider: "google", callbackURL: "/tracks/1?tab=mix", errorCallbackURL: "/" });
  });
});

describe("HttpSessionExpiryRepository", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("tells the listener when the API answers 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "session.required", message: "" }), { status: 401 })));
    const listener = vi.fn();
    const stop = new HttpSessionExpiryRepository().watch(listener);

    await httpGet("/api/v1/tracks").catch(() => undefined);
    stop();

    expect(listener).toHaveBeenCalledOnce();
  });
});
