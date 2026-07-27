import { type Mocked, vi } from "vitest";
import type { UploadRepository } from "../../domain/UploadRepository.ts";

export const create = (overrides: Partial<UploadRepository> = {}): Mocked<UploadRepository> =>
  ({
    put: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as Mocked<UploadRepository>;
