import { describe, expect, it } from "vitest";
import type { Outcome, TrackGateway, UploadGateway } from "../../src/application/ports/index.ts";
import { UploadTrack, type UploadPhase } from "../../src/application/use-cases/upload-track.ts";
import { checkUpload, resolveContentType } from "../../src/domain/upload-policy.ts";

describe("upload policy", () => {
  it("falls back to the extension when the browser gives no type", () => {
    expect(resolveContentType({ name: "live.MKV", type: "" })).toBe("video/x-matroska");
  });

  it("rejects unknown types and big files", () => {
    expect(checkUpload({ name: "a.exe", type: "application/x-msdownload", size: 1 })._unsafeUnwrapErr().code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(checkUpload({ name: "a.mp3", type: "audio/mpeg", size: 300 * 1_048_576 })._unsafeUnwrapErr().code).toBe("FILE_TOO_LARGE");
  });
});

const job = { id: "j1", trackId: "t1", status: "queued" as const, stage: null, progress: 0, error: null };

function gateways(putResult: Outcome<void> = { ok: true, value: undefined }) {
  const calls: string[] = [];
  const tracks = {
    createUpload: async () => (calls.push("create"), { ok: true as const, value: { trackId: "t1", uploadUrl: "https://s3/put" } }),
    requestSeparation: async () => (calls.push("separate"), { ok: true as const, value: job }),
  } as unknown as TrackGateway;
  const uploads: UploadGateway = {
    put: async (_url, _file, _type, onProgress) => {
      calls.push("put");
      onProgress(0.5);
      return putResult;
    },
  };
  return { calls, uc: new UploadTrack({ tracks, uploads }) };
}

describe("UploadTrack", () => {
  const file = new File(["x"], "song.mp3", { type: "audio/mpeg" });

  it("creates, uploads with progress, then requests the separation", async () => {
    const { calls, uc } = gateways();
    const phases: UploadPhase[] = [];
    const result = await uc.execute(file, (p) => phases.push(p));
    expect(result).toEqual({ ok: true, value: { trackId: "t1", job } });
    expect(calls).toEqual(["create", "put", "separate"]);
    expect(phases).toContainEqual({ phase: "uploading", fraction: 0.5 });
    expect(phases.at(-1)).toEqual({ phase: "requesting" });
  });

  it("stops before calling the API when the file is invalid", async () => {
    const { calls, uc } = gateways();
    const result = await uc.execute(new File(["x"], "a.txt", { type: "text/plain" }), () => {});
    expect(result.ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it("does not request a separation when the upload fails", async () => {
    const { calls, uc } = gateways({ ok: false, error: { code: "NETWORK_ERROR", message: "" } });
    expect((await uc.execute(file, () => {})).ok).toBe(false);
    expect(calls).toEqual(["create", "put"]);
  });
});
