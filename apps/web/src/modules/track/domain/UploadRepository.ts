import type { MediaType } from "./MediaType.ts";
import type { UploadProgress } from "./UploadProgress.ts";
import type { UploadTicket } from "./UploadTicket.ts";

export interface UploadRequest {
  readonly ticket: UploadTicket;
  readonly file: Blob;
  readonly mediaType: MediaType;
  readonly onProgress: (progress: UploadProgress) => void;
  readonly signal?: AbortSignal;
}

export interface UploadRepository {
  put(request: UploadRequest): Promise<void>;
}
