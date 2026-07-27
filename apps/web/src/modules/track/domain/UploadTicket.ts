import { TrackId, type TrackIdPrimitive } from "./TrackId.ts";
import { Url, type UrlPrimitive } from "./Url.ts";

export interface UploadTicketPrimitive {
  readonly trackId: TrackIdPrimitive;
  readonly uploadUrl: UrlPrimitive;
}

export class UploadTicket {
  private readonly trackId: TrackId;
  private readonly uploadUrl: Url;

  private constructor(trackId: TrackId, uploadUrl: Url) {
    this.trackId = trackId;
    this.uploadUrl = uploadUrl;
  }

  static create(trackId: TrackId, uploadUrl: Url): UploadTicket {
    return new UploadTicket(trackId, uploadUrl);
  }

  static fromPrimitive(data: UploadTicketPrimitive): UploadTicket {
    return UploadTicket.create(TrackId.fromPrimitive(data.trackId), Url.fromPrimitive(data.uploadUrl));
  }

  getTrackId(): TrackId {
    return this.trackId;
  }

  getUploadUrl(): Url {
    return this.uploadUrl;
  }

  equals(other: UploadTicket): boolean {
    return this.trackId.equals(other.trackId) && this.uploadUrl.equals(other.uploadUrl);
  }

  toPrimitive(): UploadTicketPrimitive {
    return { trackId: this.trackId.toPrimitive(), uploadUrl: this.uploadUrl.toPrimitive() };
  }
}
