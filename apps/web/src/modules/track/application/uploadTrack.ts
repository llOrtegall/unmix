import type { TrackId } from "../domain/TrackId.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { UploadCandidate } from "../domain/UploadCandidate.ts";
import { UploadProgress } from "../domain/UploadProgress.ts";
import type { UploadRepository } from "../domain/UploadRepository.ts";

export interface UploadTrackInput {
  readonly file: File;
  readonly onProgress: (progress: UploadProgress) => void;
  readonly signal?: AbortSignal;
}

export const uploadTrack =
  ({ trackRepository, uploadRepository }: { trackRepository: TrackRepository; uploadRepository: UploadRepository }) =>
  async ({ file, onProgress, signal }: UploadTrackInput): Promise<TrackId> => {
    const candidate = UploadCandidate.fromFile(file);
    const ticket = await trackRepository.createUpload(candidate);

    onProgress(UploadProgress.uploading(0));
    await uploadRepository.put({ ticket, file, mediaType: candidate.getMediaType(), onProgress, signal });

    onProgress(UploadProgress.requesting());
    await trackRepository.requestSeparation(ticket.getTrackId());
    return ticket.getTrackId();
  };
