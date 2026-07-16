import { type Mocked, vi } from "vitest";
import type { DemoSongRepository } from "../../domain/DemoSongRepository.ts";

export const create = (overrides: Partial<DemoSongRepository> = {}): Mocked<DemoSongRepository> =>
  ({
    find: vi.fn().mockResolvedValue(null),
    ...overrides,
  }) as Mocked<DemoSongRepository>;
