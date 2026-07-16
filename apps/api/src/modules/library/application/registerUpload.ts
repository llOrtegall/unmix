import { UserId } from "../../shared/domain/UserId.ts";
import { FileSize } from "../domain/FileSize.ts";
import { MediaType } from "../domain/MediaType.ts";
import { OriginalFilename } from "../domain/OriginalFilename.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";
import { Track } from "../domain/Track.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { UploadTicket } from "../domain/UploadTicket.ts";
import { UrlLifetime } from "../domain/UrlLifetime.ts";

export interface RegisterUploadInput {
  readonly ownerId: string;
  readonly filename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly storageRepository: StorageRepository;
  readonly uploadLimit: FileSize;
}

export const registerUpload =
  ({ trackRepository, storageRepository, uploadLimit }: Dependencies) =>
  async (input: RegisterUploadInput): Promise<UploadTicket> => {
    const track = Track.register({
      ownerId: UserId.fromPrimitive(input.ownerId),
      filename: OriginalFilename.create(input.filename),
      mediaType: MediaType.create(input.contentType),
      size: FileSize.create(input.sizeBytes),
      uploadLimit,
    });
    await trackRepository.save(track);

    const lifetime = UrlLifetime.forUpload();
    const uploadUrl = await storageRepository.signUpload(track.getInputKey(), track.getMediaType(), lifetime);
    return UploadTicket.create(track.getId(), uploadUrl, lifetime);
  };
