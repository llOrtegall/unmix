import type { Clock, IdGenerator } from "../../../../shared/kernel/ports.ts";
import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import type { LibraryError } from "../../domain/errors.ts";
import { Track } from "../../domain/track.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";

export interface RegisterUploadInput {
  ownerId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface RegisterUploadOutput {
  trackId: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface RegisterUploadConfig {
  maxSizeBytes: number;
  uploadUrlTtlSeconds: number;
}

export class RegisterUpload {
  #tracks: TrackRepository;
  #storage: ObjectStorage;
  #ids: IdGenerator;
  #clock: Clock;
  #config: RegisterUploadConfig;

  constructor(deps: {
    tracks: TrackRepository;
    storage: ObjectStorage;
    ids: IdGenerator;
    clock: Clock;
    config: RegisterUploadConfig;
  }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
    this.#ids = deps.ids;
    this.#clock = deps.clock;
    this.#config = deps.config;
  }

  async execute(input: RegisterUploadInput): Promise<Result<RegisterUploadOutput, LibraryError>> {
    const track = Track.register({
      id: this.#ids.next(),
      ...input,
      maxSizeBytes: this.#config.maxSizeBytes,
      now: this.#clock.now(),
    });
    if (track.isErr()) return err(track.error);

    const snapshot = track.value.toSnapshot();
    await this.#tracks.save(track.value);
    const uploadUrl = await this.#storage.presignUpload(
      snapshot.inputKey,
      snapshot.mediaType.value,
      this.#config.uploadUrlTtlSeconds,
    );
    return ok({ trackId: snapshot.id, uploadUrl, expiresIn: this.#config.uploadUrlTtlSeconds });
  }
}

