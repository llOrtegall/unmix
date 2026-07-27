import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestFailedError } from "../../../shared/domain/errors/RequestFailedError.ts";
import { UploadCancelledError } from "../../domain/errors/UploadCancelledError.ts";
import { UploadFailedError } from "../../domain/errors/UploadFailedError.ts";
import { MediaType } from "../../domain/MediaType.ts";
import { UploadProgress } from "../../domain/UploadProgress.ts";
import { XhrUploadRepository } from "../../infrastructure/XhrUploadRepository.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

class FakeXhr {
  static last: FakeXhr;
  status = 0;
  readonly headers: Record<string, string> = {};
  readonly upload: { onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  method = "";
  url = "";
  sent: unknown;

  constructor() {
    FakeXhr.last = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  send(body: unknown) {
    this.sent = body;
  }

  abort() {
    this.onabort?.();
  }
}

describe("XhrUploadRepository", () => {
  const ticket = TrackRepositoryMother.ticket();
  const file = new Blob(["audio"]);
  const mediaType = MediaType.create("audio/flac");

  beforeEach(() => vi.stubGlobal("XMLHttpRequest", FakeXhr));
  afterEach(() => vi.unstubAllGlobals());

  it("puts the file to the upload URL and reports progress", async () => {
    const onProgress = vi.fn();
    const upload = new XhrUploadRepository().put({ ticket, file, mediaType, onProgress });
    const xhr = FakeXhr.last;

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    xhr.status = 200;
    xhr.onload?.();
    await upload;

    expect([xhr.method, xhr.url, xhr.headers["content-type"], xhr.sent]).toEqual(["PUT", ticket.getUploadUrl().toPrimitive(), "audio/flac", file]);
    expect(onProgress).toHaveBeenCalledWith(UploadProgress.uploading(0.25));
  });

  it("fails when storage rejects the file", async () => {
    const upload = new XhrUploadRepository().put({ ticket, file, mediaType, onProgress: vi.fn() });
    FakeXhr.last.status = 403;
    FakeXhr.last.onload?.();

    await expect(upload).rejects.toThrow(UploadFailedError);
  });

  it("reports a network failure", async () => {
    const upload = new XhrUploadRepository().put({ ticket, file, mediaType, onProgress: vi.fn() });
    FakeXhr.last.onerror?.();

    await expect(upload).rejects.toThrow(RequestFailedError);
  });

  it("cancels when the signal aborts", async () => {
    const controller = new AbortController();
    const upload = new XhrUploadRepository().put({ ticket, file, mediaType, onProgress: vi.fn(), signal: controller.signal });

    controller.abort();

    await expect(upload).rejects.toThrow(UploadCancelledError);
  });
});
