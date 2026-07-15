import { ApiError, CreateUploadResponse, JobResponse, ListTracksResponse, TrackDetail, type TrackSummary as TrackSummaryDto } from "@unmix/contracts";
import type { z } from "zod";
import type { Outcome, TrackGateway } from "../../application/ports/index.ts";
import type { Job } from "../../domain/job.ts";
import type { Track, TrackSummary } from "../../domain/track.ts";

/** Talks to /api/v1 and maps DTOs (contracts) to domain models. */
export class HttpTrackGateway implements TrackGateway {
  #base: string;
  #onUnauthorized: () => void;

  constructor(baseUrl: string, options: { onUnauthorized?: () => void } = {}) {
    this.#base = baseUrl;
    this.#onUnauthorized = options.onUnauthorized ?? (() => {});
  }

  createUpload(input: { filename: string; contentType: string; sizeBytes: number }) {
    return this.#request("/uploads", CreateUploadResponse, { method: "POST", body: JSON.stringify(input) });
  }

  async requestSeparation(trackId: string): Promise<Outcome<Job>> {
    return map(await this.#request(`/tracks/${trackId}/jobs`, JobResponse, { method: "POST" }), toJob);
  }

  async getTrack(trackId: string): Promise<Outcome<Track>> {
    return map(await this.#request(`/tracks/${trackId}`, TrackDetail), (t) => ({
      ...toSummary(t),
      latestJobId: t.latestJobId,
      stems: t.stems.map((s) => ({
        name: s.name,
        downloadUrl: s.url,
        previewUrl: s.previewUrl,
        peaksUrl: s.peaksUrl,
        midiUrl: s.midiUrl,
        sizeBytes: s.sizeBytes,
        silent: s.silent,
      })),
    }));
  }

  async listTracks(cursor?: string) {
    const query = new URLSearchParams({ limit: "30", ...(cursor ? { cursor } : {}) });
    return map(await this.#request(`/tracks?${query}`, ListTracksResponse), (page) => ({
      items: page.items.map(toSummary),
      nextCursor: page.nextCursor,
    }));
  }

  async deleteTrack(trackId: string): Promise<Outcome<void>> {
    return this.#request(`/tracks/${trackId}`, null, { method: "DELETE" });
  }

  async getJob(jobId: string): Promise<Outcome<Job>> {
    return map(await this.#request(`/jobs/${jobId}`, JobResponse), toJob);
  }

  zipUrl(trackId: string): string {
    return `${this.#base}/tracks/${trackId}/download.zip`;
  }

  async #request<S extends z.ZodType>(path: string, schema: S, init?: RequestInit): Promise<Outcome<z.infer<S>>>;
  async #request(path: string, schema: null, init?: RequestInit): Promise<Outcome<void>>;
  async #request(path: string, schema: z.ZodType | null, init: RequestInit = {}): Promise<Outcome<unknown>> {
    let res: Response;
    try {
      res = await fetch(`${this.#base}${path}`, {
        ...init,
        headers: init.body ? { "content-type": "application/json" } : undefined,
      });
    } catch {
      return { ok: false, error: { code: "NETWORK_ERROR", message: "" } };
    }
    if (res.status === 401) this.#onUnauthorized();
    if (!res.ok) {
      const body = ApiError.safeParse(await res.json().catch(() => null));
      return { ok: false, error: body.success ? body.data : { code: "INTERNAL_ERROR", message: res.statusText } };
    }
    if (!schema) return { ok: true, value: undefined };
    const parsed = schema.safeParse(await res.json());
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false, error: { code: "INVALID_RESPONSE", message: parsed.error.message } };
  }
}

function map<A, B>(outcome: Outcome<A>, fn: (value: A) => B): Outcome<B> {
  return outcome.ok ? { ok: true, value: fn(outcome.value) } : outcome;
}

export function toJob(j: z.infer<typeof JobResponse>): Job {
  return { id: j.jobId, trackId: j.trackId, status: j.status, stage: j.stage, progress: j.progress, error: j.error };
}

function toSummary(t: TrackSummaryDto): TrackSummary {
  return { id: t.trackId, title: t.title, status: t.status, durationSeconds: t.durationSeconds, credit: t.credit, createdAt: new Date(t.createdAt) };
}
