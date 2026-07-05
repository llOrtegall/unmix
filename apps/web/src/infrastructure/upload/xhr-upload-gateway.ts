import type { Outcome, UploadGateway } from "../../application/ports/index.ts";

/** XMLHttpRequest because fetch still cannot report upload progress in every browser. */
export class XhrUploadGateway implements UploadGateway {
  put(url: string, file: Blob, contentType: string, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<Outcome<void>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("content-type", contentType);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () =>
        resolve(xhr.status < 300 ? { ok: true, value: undefined } : { ok: false, error: { code: "UPLOAD_FAILED", message: `HTTP ${xhr.status}` } });
      xhr.onerror = () => resolve({ ok: false, error: { code: "NETWORK_ERROR", message: "" } });
      xhr.onabort = () => resolve({ ok: false, error: { code: "UPLOAD_CANCELLED", message: "" } });
      signal?.addEventListener("abort", () => xhr.abort());
      xhr.send(file);
    });
  }
}
