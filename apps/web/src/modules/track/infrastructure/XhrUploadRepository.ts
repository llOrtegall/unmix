import { RequestFailedError } from "../../shared/domain/errors/RequestFailedError.ts";
import { UploadCancelledError } from "../domain/errors/UploadCancelledError.ts";
import { UploadFailedError } from "../domain/errors/UploadFailedError.ts";
import { UploadProgress } from "../domain/UploadProgress.ts";
import type { UploadRepository, UploadRequest } from "../domain/UploadRepository.ts";

const LAST_SUCCESS_STATUS = 299;

/** XMLHttpRequest because fetch still cannot report upload progress in every browser. */
export class XhrUploadRepository implements UploadRepository {
  put({ ticket, file, mediaType, onProgress, signal }: UploadRequest): Promise<void> {
    const url = ticket.getUploadUrl().toPrimitive();
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("content-type", mediaType.toPrimitive());
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(UploadProgress.uploading(event.loaded / event.total));
      };
      xhr.onload = () => (xhr.status <= LAST_SUCCESS_STATUS ? resolve() : reject(new UploadFailedError(xhr.status)));
      xhr.onerror = () => reject(RequestFailedError.network(url));
      xhr.onabort = () => reject(new UploadCancelledError());
      signal?.addEventListener("abort", () => xhr.abort());
      xhr.send(file);
    });
  }
}
