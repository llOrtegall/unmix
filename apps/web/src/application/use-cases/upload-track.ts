import { checkUpload } from "../../domain/upload-policy.ts";
import type { Job } from "../../domain/job.ts";
import type { Outcome, TrackGateway, UploadGateway } from "../ports/index.ts";

export type UploadPhase = { phase: "uploading"; fraction: number } | { phase: "requesting" };

/** Validate, upload straight to storage, then ask the API to separate. */
export class UploadTrack {
  #tracks: TrackGateway;
  #uploads: UploadGateway;

  constructor(deps: { tracks: TrackGateway; uploads: UploadGateway }) {
    this.#tracks = deps.tracks;
    this.#uploads = deps.uploads;
  }

  async execute(file: File, onPhase: (phase: UploadPhase) => void, signal?: AbortSignal): Promise<Outcome<{ trackId: string; job: Job }>> {
    const check = checkUpload(file);
    if (check.isErr()) {
      return { ok: false, error: { code: check.error.code, message: "" } };
    }
    const contentType = check.value;

    const upload = await this.#tracks.createUpload({ filename: file.name, contentType, sizeBytes: file.size });
    if (!upload.ok) return upload;

    onPhase({ phase: "uploading", fraction: 0 });
    const put = await this.#uploads.put(upload.value.uploadUrl, file, contentType, (fraction) => onPhase({ phase: "uploading", fraction }), signal);
    if (!put.ok) return put;

    onPhase({ phase: "requesting" });
    const job = await this.#tracks.requestSeparation(upload.value.trackId);
    if (!job.ok) return job;
    return { ok: true, value: { trackId: upload.value.trackId, job: job.value } };
  }
}
