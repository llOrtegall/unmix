import type { ObjectKey } from "../../shared/domain/ObjectKey.ts";
import type { FileSize } from "./FileSize.ts";
import type { MediaType } from "./MediaType.ts";
import type { SignedUrl } from "./SignedUrl.ts";
import type { TrackFolder } from "./TrackFolder.ts";
import type { TrackFolderList } from "./TrackFolderList.ts";
import type { UrlLifetime } from "./UrlLifetime.ts";

export interface StorageRepository {
  /** The URL only accepts a body of exactly `size` bytes, so the declared size is the stored size. */
  signUpload(key: ObjectKey, mediaType: MediaType, size: FileSize, lifetime: UrlLifetime): Promise<SignedUrl>;
  signDownload(key: ObjectKey, lifetime: UrlLifetime, filename?: string): Promise<SignedUrl>;
  exists(key: ObjectKey): Promise<boolean>;
  read(key: ObjectKey): Promise<ReadableStream<Uint8Array>>;
  deleteFolder(folder: TrackFolder): Promise<void>;
  findTrackFolders(): Promise<TrackFolderList>;
}
