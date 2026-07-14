import { InvalidUserIdError } from "./errors/InvalidUserIdError.ts";

export type UserIdPrimitive = string;

export class UserId {
  private static readonly UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): UserId {
    UserId.ensureIsUuid(value);
    return new UserId(value.toLowerCase());
  }

  static generate(): UserId {
    return UserId.create(crypto.randomUUID());
  }

  static fromPrimitive(data: UserIdPrimitive): UserId {
    return UserId.create(data);
  }

  private static ensureIsUuid(value: string): void {
    if (!UserId.UUID_FORMAT.test(value)) throw new InvalidUserIdError(value);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toPrimitive(): UserIdPrimitive {
    return this.value;
  }
}
