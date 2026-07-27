import { type Mocked, vi } from "vitest";
import type { SessionExpiryRepository } from "../../domain/SessionExpiryRepository.ts";
import type { SessionRepository } from "../../domain/SessionRepository.ts";

export const create = (overrides: Partial<SessionRepository> = {}): Mocked<SessionRepository> =>
  ({
    findCurrentUser: vi.fn().mockResolvedValue(null),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as Mocked<SessionRepository>;

export const expiry = (overrides: Partial<SessionExpiryRepository> = {}): Mocked<SessionExpiryRepository> =>
  ({
    watch: vi.fn().mockReturnValue(vi.fn()),
    ...overrides,
  }) as Mocked<SessionExpiryRepository>;
