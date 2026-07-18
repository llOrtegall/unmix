import { type Mocked, vi } from "vitest";
import type { TrackCatalogRepository } from "../../domain/TrackCatalogRepository.ts";
import * as TrackMother from "../../../library/test/helpers/TrackMother.ts";

export const create = (overrides: Partial<TrackCatalogRepository> = {}): Mocked<TrackCatalogRepository> =>
  ({
    findSeparableTrack: vi.fn().mockResolvedValue(TrackMother.create({ status: "uploaded" })),
    isOwnedBy: vi.fn().mockResolvedValue(true),
    ...overrides,
  }) as Mocked<TrackCatalogRepository>;
