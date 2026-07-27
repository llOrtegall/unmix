import type { CreateUploadResponse, ListTracksResponse, TrackDetail, TrackSummary as TrackSummaryDto } from "@unmix/contracts";
import { httpGet, httpSend } from "../../shared/infrastructure/http.ts";
import type { PageCursor } from "../domain/PageCursor.ts";
import { Track } from "../domain/Track.ts";
import type { TrackId } from "../domain/TrackId.ts";
import { TrackPage } from "../domain/TrackPage.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import type { TrackSummaryPrimitive } from "../domain/TrackSummary.ts";
import type { UploadCandidate } from "../domain/UploadCandidate.ts";
import { UploadTicket } from "../domain/UploadTicket.ts";

const PAGE_SIZE = "30";

const toSummaryPrimitive = (dto: TrackSummaryDto): TrackSummaryPrimitive => ({
  id: dto.trackId,
  title: dto.title,
  status: dto.status,
  durationSeconds: dto.durationSeconds,
  credit: dto.credit,
  createdAt: dto.createdAt,
});

export class HttpTrackRepository implements TrackRepository {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async list(cursor: PageCursor | null): Promise<TrackPage> {
    const query = new URLSearchParams({ limit: PAGE_SIZE, ...(cursor ? { cursor: cursor.toPrimitive() } : {}) });
    const page = await httpGet<ListTracksResponse>(`${this.baseUrl}/tracks?${query}`);
    return TrackPage.fromPrimitive({ tracks: page?.items.map(toSummaryPrimitive) ?? [], nextCursor: page?.nextCursor ?? null });
  }

  async findById(id: TrackId): Promise<Track | null> {
    const detail = await httpGet<TrackDetail>(this.trackUrl(id));
    if (!detail) return null;
    return Track.fromPrimitive({
      ...toSummaryPrimitive(detail),
      latestJobId: detail.latestJobId,
      archiveUrl: `${this.trackUrl(id)}/download.zip`,
      stems: detail.stems.map((stem) => ({
        name: stem.name,
        downloadUrl: stem.url,
        previewUrl: stem.previewUrl,
        peaksUrl: stem.peaksUrl,
        midiUrl: stem.midiUrl,
        sizeBytes: stem.sizeBytes,
        silent: stem.silent,
      })),
    });
  }

  async delete(id: TrackId): Promise<void> {
    await httpSend(this.trackUrl(id), { method: "DELETE" });
  }

  async createUpload(candidate: UploadCandidate): Promise<UploadTicket> {
    const { filename, mediaType, sizeBytes } = candidate.toPrimitive();
    const response = await httpSend<CreateUploadResponse>(`${this.baseUrl}/uploads`, {
      method: "POST",
      body: JSON.stringify({ filename, contentType: mediaType, sizeBytes }),
    });
    return UploadTicket.fromPrimitive({ trackId: response.trackId, uploadUrl: response.uploadUrl });
  }

  async requestSeparation(id: TrackId): Promise<void> {
    await httpSend(`${this.trackUrl(id)}/jobs`, { method: "POST" });
  }

  private trackUrl(id: TrackId): string {
    return `${this.baseUrl}/tracks/${id.toPrimitive()}`;
  }
}
