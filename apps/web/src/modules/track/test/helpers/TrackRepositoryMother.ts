import { faker } from "@faker-js/faker";
import { type Mocked, vi } from "vitest";
import { TrackList } from "../../domain/TrackList.ts";
import { TrackPage } from "../../domain/TrackPage.ts";
import type { TrackRepository } from "../../domain/TrackRepository.ts";
import { UploadTicket } from "../../domain/UploadTicket.ts";

export const ticket = (): UploadTicket =>
  UploadTicket.fromPrimitive({ trackId: faker.string.uuid(), uploadUrl: faker.internet.url() });

export const create = (overrides: Partial<TrackRepository> = {}): Mocked<TrackRepository> =>
  ({
    list: vi.fn().mockResolvedValue(TrackPage.create(TrackList.empty(), null)),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    createUpload: vi.fn().mockResolvedValue(ticket()),
    requestSeparation: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as Mocked<TrackRepository>;
