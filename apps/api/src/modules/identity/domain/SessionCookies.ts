import { InvalidSessionCookiesError } from "./errors/InvalidSessionCookiesError.ts";

export type SessionCookiesPrimitive = string;

export class SessionCookies {
  private static readonly MAX_LENGTH = 16_384;

  private readonly header: string;

  private constructor(header: string) {
    this.header = header;
  }

  static create(header: string): SessionCookies {
    SessionCookies.ensureDoesNotExceedMaxLength(header);
    return new SessionCookies(header.trim());
  }

  static fromPrimitive(data: SessionCookiesPrimitive): SessionCookies {
    return SessionCookies.create(data);
  }

  private static ensureDoesNotExceedMaxLength(header: string): void {
    if (header.length > SessionCookies.MAX_LENGTH) {
      throw new InvalidSessionCookiesError(`the header exceeds ${SessionCookies.MAX_LENGTH} characters`);
    }
  }

  isEmpty(): boolean {
    return this.header.length === 0;
  }

  equals(other: SessionCookies): boolean {
    return this.header === other.header;
  }

  toPrimitive(): SessionCookiesPrimitive {
    return this.header;
  }
}
