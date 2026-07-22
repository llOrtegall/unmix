import { type Mocked, vi } from "vitest";
import type { StemArchiveRepository } from "../../domain/StemArchiveRepository.ts";

export const create = (overrides: Partial<StemArchiveRepository> = {}): Mocked<StemArchiveRepository> =>
  ({
    pack: vi.fn(async () => new Blob(["zip"]).stream()),
    ...overrides,
  }) as Mocked<StemArchiveRepository>;
