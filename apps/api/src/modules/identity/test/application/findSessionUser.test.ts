import { describe, expect, it, vi } from "vitest";
import * as UserIdMother from "../../../shared/test/helpers/UserIdMother.ts";
import { findSessionUser } from "../../application/findSessionUser.ts";
import { SessionCookies } from "../../domain/SessionCookies.ts";
import * as SessionRepositoryMother from "../helpers/SessionRepositoryMother.ts";

describe("findSessionUser", () => {
  describe("Basic behaviour", () => {
    it("returns the user behind the session cookies", async () => {
      const userId = UserIdMother.create();
      const sessionRepository = SessionRepositoryMother.create({ findUserId: vi.fn().mockResolvedValue(userId) });

      const found = await findSessionUser({ sessionRepository })("better-auth.session_token=abc");

      expect(found).toBe(userId);
      expect(sessionRepository.findUserId).toHaveBeenCalledWith(SessionCookies.create("better-auth.session_token=abc"));
    });

    it("returns nobody when the session is not valid", async () => {
      const found = await findSessionUser({ sessionRepository: SessionRepositoryMother.create() })("better-auth.session_token=old");

      expect(found).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("does not ask the session store when there are no cookies", async () => {
      const sessionRepository = SessionRepositoryMother.create();

      expect(await findSessionUser({ sessionRepository })("")).toBeNull();
      expect(sessionRepository.findUserId).not.toHaveBeenCalled();
    });
  });
});
