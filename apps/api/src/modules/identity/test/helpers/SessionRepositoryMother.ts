import { type Mocked, vi } from "vitest";
import type { SessionRepository } from "../../domain/SessionRepository.ts";

export const create = (overrides: Partial<SessionRepository> = {}): Mocked<SessionRepository> =>
  ({
    findUserId: vi.fn().mockResolvedValue(null),
    handle: vi.fn().mockResolvedValue(new Response(null)),
    ...overrides,
  }) as Mocked<SessionRepository>;
