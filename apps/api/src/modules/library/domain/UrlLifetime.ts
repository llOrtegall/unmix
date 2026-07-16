import { InvalidUrlLifetimeError } from "./errors/InvalidUrlLifetimeError.ts";

export type UrlLifetimePrimitive = number;

export class UrlLifetime {
  private static readonly UPLOAD_SECONDS = 900;
  private static readonly DOWNLOAD_SECONDS = 3600;

  private readonly seconds: number;

  private constructor(seconds: number) {
    this.seconds = seconds;
  }

  static create(seconds: number): UrlLifetime {
    UrlLifetime.ensureIsAPositiveInteger(seconds);
    return new UrlLifetime(seconds);
  }

  static forUpload(): UrlLifetime {
    return UrlLifetime.create(UrlLifetime.UPLOAD_SECONDS);
  }

  static forDownload(): UrlLifetime {
    return UrlLifetime.create(UrlLifetime.DOWNLOAD_SECONDS);
  }

  static fromPrimitive(data: UrlLifetimePrimitive): UrlLifetime {
    return UrlLifetime.create(data);
  }

  private static ensureIsAPositiveInteger(seconds: number): void {
    if (!Number.isInteger(seconds) || seconds <= 0) throw new InvalidUrlLifetimeError(seconds);
  }

  equals(other: UrlLifetime): boolean {
    return this.seconds === other.seconds;
  }

  toPrimitive(): UrlLifetimePrimitive {
    return this.seconds;
  }
}
