import { type Mocked, vi } from "vitest";
import type { TransactionRepository } from "../../domain/TransactionRepository.ts";

export const create = (overrides: Partial<TransactionRepository> = {}): Mocked<TransactionRepository> =>
  ({
    run: vi.fn((work: () => Promise<unknown>) => work()),
    ...overrides,
  }) as Mocked<TransactionRepository>;
