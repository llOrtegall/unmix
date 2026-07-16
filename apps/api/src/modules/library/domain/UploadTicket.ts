import { SignedUrl, type SignedUrlPrimitive } from "./SignedUrl.ts";
import { TrackId, type TrackIdPrimitive } from "./TrackId.ts";
import { UrlLifetime, type UrlLifetimePrimitive } from "./UrlLifetime.ts";

export interface UploadTicketPrimitive {
  readonly trackId: TrackIdPrimitive;
  readonly uploadUrl: SignedUrlPrimitive;
  readonly expiresInSeconds: UrlLifetimePrimitive;
}

export class UploadTicket {
  private readonly trackId: TrackId;
  private readonly uploadUrl: SignedUrl;
  private readonly lifetime: UrlLifetime;

  private constructor(trackId: TrackId, uploadUrl: SignedUrl, lifetime: UrlLifetime) {
    this.trackId = trackId;
    this.uploadUrl = uploadUrl;
    this.lifetime = lifetime;
  }

  static create(trackId: TrackId, uploadUrl: SignedUrl, lifetime: UrlLifetime): UploadTicket {
    return new UploadTicket(trackId, uploadUrl, lifetime);
  }

  static fromPrimitive(data: UploadTicketPrimitive): UploadTicket {
    return UploadTicket.create(
      TrackId.fromPrimitive(data.trackId),
      SignedUrl.fromPrimitive(data.uploadUrl),
      UrlLifetime.fromPrimitive(data.expiresInSeconds),
    );
  }

  equals(other: UploadTicket): boolean {
    return this.trackId.equals(other.trackId) && this.uploadUrl.equals(other.uploadUrl) && this.lifetime.equals(other.lifetime);
  }

  toPrimitive(): UploadTicketPrimitive {
    return {
      trackId: this.trackId.toPrimitive(),
      uploadUrl: this.uploadUrl.toPrimitive(),
      expiresInSeconds: this.lifetime.toPrimitive(),
    };
  }
}
