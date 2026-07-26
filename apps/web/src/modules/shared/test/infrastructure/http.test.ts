import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestFailedError } from "../../domain/errors/RequestFailedError.ts";
import { SessionExpiredError } from "../../domain/errors/SessionExpiredError.ts";
import { httpGet, httpSend, onSessionExpired } from "../../infrastructure/http.ts";

const ENDPOINT = "/api/v1/tracks";

const respondWith = (status: number, body?: unknown) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status })));

describe("http", () => {
  afterEach(() => vi.unstubAllGlobals());

  describe("Basic behaviour", () => {
    it("reads a JSON body", async () => {
      const body = { title: faker.music.songName() };
      respondWith(200, body);

      expect(await httpGet(ENDPOINT)).toEqual(body);
    });

    it("sends a JSON body and reads the answer", async () => {
      respondWith(201, { trackId: "t" });

      expect(await httpSend(ENDPOINT, { method: "POST", body: JSON.stringify({ a: 1 }) })).toEqual({ trackId: "t" });
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(ENDPOINT, expect.objectContaining({ headers: { "content-type": "application/json" } }));
    });

    it("returns nothing for a response without content", async () => {
      respondWith(204);

      expect(await httpSend(ENDPOINT, { method: "DELETE" })).toBeUndefined();
    });
  });

  describe("Edge cases", () => {
    it("treats a missing resource as null", async () => {
      respondWith(404, { code: "track.not_found", message: "gone" });

      expect(await httpGet(ENDPOINT)).toBeNull();
    });
  });

  describe("Error scenarios", () => {
    it("keeps the API's error code", async () => {
      respondWith(409, { code: "track.busy", message: "busy" });

      await expect(httpSend(ENDPOINT, { method: "DELETE" })).rejects.toMatchObject({ code: "track.busy", status: 409 });
    });

    it("falls back to a generic code when the body is not an API error", async () => {
      respondWith(502);

      await expect(httpGet(ENDPOINT)).rejects.toMatchObject({ code: "request.failed", status: 502 });
    });

    it("reports a network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

      const failure = await httpGet(ENDPOINT).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(RequestFailedError);
      expect(failure).toMatchObject({ code: "request.network" });
      expect((failure as RequestFailedError).isNetworkFailure()).toBe(true);
    });

    it("expires the session on a 401 and tells the listeners", async () => {
      const listener = vi.fn();
      const unsubscribe = onSessionExpired(listener);
      respondWith(401, { code: "session.required", message: "sign in" });

      await expect(httpGet(ENDPOINT)).rejects.toBeInstanceOf(SessionExpiredError);
      unsubscribe();
      await expect(httpGet(ENDPOINT)).rejects.toBeInstanceOf(SessionExpiredError);

      expect(listener).toHaveBeenCalledOnce();
    });
  });
});
