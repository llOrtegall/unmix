import { faker } from "@faker-js/faker";
import { type Mocked, vi } from "vitest";
import type { ObjectKey } from "../../../shared/domain/ObjectKey.ts";
import { SignedUrl } from "../../domain/SignedUrl.ts";
import type { StorageRepository } from "../../domain/StorageRepository.ts";
import { TrackFolderList } from "../../domain/TrackFolderList.ts";

export const signedUrlFor = (key: ObjectKey): SignedUrl =>
  SignedUrl.create(`https://storage.test/${key.toPrimitive()}?signature=${faker.string.alphanumeric(8)}`);

export const create = (overrides: Partial<StorageRepository> = {}): Mocked<StorageRepository> =>
  ({
    signUpload: vi.fn(async (key: ObjectKey) => signedUrlFor(key)),
    signDownload: vi.fn(async (key: ObjectKey) => signedUrlFor(key)),
    exists: vi.fn().mockResolvedValue(true),
    read: vi.fn(async () => new Blob([]).stream()),
    deleteFolder: vi.fn().mockResolvedValue(undefined),
    findTrackFolders: vi.fn().mockResolvedValue(TrackFolderList.empty()),
    ...overrides,
  }) as Mocked<StorageRepository>;
