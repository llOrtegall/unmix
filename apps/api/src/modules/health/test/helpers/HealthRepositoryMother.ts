import { type Mocked, vi } from "vitest";
import type { HealthRepository } from "../../domain/HealthRepository.ts";

export const create = (overrides: Partial<HealthRepository> = {}): Mocked<HealthRepository> =>
  ({
    ping: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as Mocked<HealthRepository>;

export const down = (): Mocked<HealthRepository> => create({ ping: vi.fn().mockRejectedValue(new Error("connection refused")) });
