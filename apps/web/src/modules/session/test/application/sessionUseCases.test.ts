import { describe, expect, it, vi } from "vitest";
import { findCurrentUser } from "../../application/findCurrentUser.ts";
import { signInWithGoogle } from "../../application/signInWithGoogle.ts";
import { signOut } from "../../application/signOut.ts";
import { watchSessionExpiry } from "../../application/watchSessionExpiry.ts";
import { SignInFailedError } from "../../domain/errors/SignInFailedError.ts";
import * as SessionRepositoryMother from "../helpers/SessionRepositoryMother.ts";
import * as UserMother from "../helpers/UserMother.ts";

describe("session use cases", () => {
  it("find the signed-in user", async () => {
    const user = UserMother.create();
    const sessionRepository = SessionRepositoryMother.create({ findCurrentUser: vi.fn().mockResolvedValue(user) });

    expect(await findCurrentUser({ sessionRepository })()).toBe(user);
  });

  it("find nobody without a session", async () => {
    expect(await findCurrentUser({ sessionRepository: SessionRepositoryMother.create() })()).toBeNull();
  });

  it("report a failed Google sign-in", async () => {
    const sessionRepository = SessionRepositoryMother.create({ findCurrentUser: vi.fn().mockRejectedValue(new SignInFailedError()) });

    await expect(findCurrentUser({ sessionRepository })()).rejects.toThrow(SignInFailedError);
  });

  it("sign in with Google and sign out", async () => {
    const sessionRepository = SessionRepositoryMother.create();

    await signInWithGoogle({ sessionRepository })();
    await signOut({ sessionRepository })();

    expect(sessionRepository.signInWithGoogle).toHaveBeenCalledOnce();
    expect(sessionRepository.signOut).toHaveBeenCalledOnce();
  });

  it("watch the session expire", () => {
    const stop = vi.fn();
    const sessionExpiryRepository = SessionRepositoryMother.expiry({ watch: vi.fn().mockReturnValue(stop) });
    const listener = vi.fn();

    expect(watchSessionExpiry({ sessionExpiryRepository })(listener)).toBe(stop);
    expect(sessionExpiryRepository.watch).toHaveBeenCalledWith(listener);
  });
});
