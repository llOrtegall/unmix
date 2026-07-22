import { describe, expect, it, vi } from "vitest";
import { handleAuthRequest } from "../../application/handleAuthRequest.ts";
import * as SessionRepositoryMother from "../helpers/SessionRepositoryMother.ts";

describe("handleAuthRequest", () => {
  it("answers with whatever the auth provider answers", async () => {
    const response = new Response("{}", { status: 302, headers: { location: "https://accounts.google.com" } });
    const sessionRepository = SessionRepositoryMother.create({ handle: vi.fn().mockResolvedValue(response) });
    const request = new Request("http://localhost/api/auth/sign-in/social", { method: "POST" });

    expect(await handleAuthRequest({ sessionRepository })(request)).toBe(response);
    expect(sessionRepository.handle).toHaveBeenCalledWith(request);
  });
});
