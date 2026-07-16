import { Readable } from "node:stream";
import { type Mocked, vi } from "vitest";
import type { StemArchiveRepository } from "../../domain/StemArchiveRepository.ts";

export const create = (overrides: Partial<StemArchiveRepository> = {}): Mocked<StemArchiveRepository> =>
  ({
    pack: vi.fn(async () => Readable.from(["zip"])),
    ...overrides,
  }) as Mocked<StemArchiveRepository>;
