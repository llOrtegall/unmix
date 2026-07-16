import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { registerUpload } from "../../application/registerUpload.ts";
import { FileTooLargeError } from "../../domain/errors/FileTooLargeError.ts";
import { UnsupportedMediaTypeError } from "../../domain/errors/UnsupportedMediaTypeError.ts";
import { FileSize } from "../../domain/FileSize.ts";
import * as StorageRepositoryMother from "../helpers/StorageRepositoryMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

const input = (overrides = {}) => ({
  ownerId: faker.string.uuid(),
  filename: "My Song.mp3",
  contentType: "audio/mpeg",
  sizeBytes: 1_000,
  ...overrides,
});

const setup = () => {
  const trackRepository = TrackRepositoryMother.create();
  const storageRepository = StorageRepositoryMother.create();
  const register = registerUpload({ trackRepository, storageRepository, uploadLimit: FileSize.create(5_000) });
  return { trackRepository, storageRepository, register };
};

describe("registerUpload", () => {
  describe("Basic behaviour", () => {
    it("saves the track and signs an upload URL for its input key", async () => {
      const { trackRepository, storageRepository, register } = setup();

      const ticket = (await register(input())).toPrimitive();

      const saved = trackRepository.save.mock.calls[0]![0].toPrimitive();
      expect(saved).toMatchObject({ id: ticket.trackId, title: "My Song", status: "awaiting_upload" });
      expect(storageRepository.signUpload.mock.calls[0]![0].toPrimitive()).toBe(saved.inputKey);
      expect(ticket.expiresInSeconds).toBe(900);
    });
  });

  describe("Error scenarios", () => {
    it("rejects an unsupported type without saving", async () => {
      const { trackRepository, register } = setup();

      await expect(register(input({ contentType: "text/plain" }))).rejects.toThrow(UnsupportedMediaTypeError);
      expect(trackRepository.save).not.toHaveBeenCalled();
    });

    it("rejects a file over the limit without saving", async () => {
      const { trackRepository, register } = setup();

      await expect(register(input({ sizeBytes: 5_001 }))).rejects.toThrow(FileTooLargeError);
      expect(trackRepository.save).not.toHaveBeenCalled();
    });
  });
});
