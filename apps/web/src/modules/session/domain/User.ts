import { AvatarUrl, type AvatarUrlPrimitive } from "./AvatarUrl.ts";
import { Email, type EmailPrimitive } from "./Email.ts";
import { UserId, type UserIdPrimitive } from "./UserId.ts";
import { UserName, type UserNamePrimitive } from "./UserName.ts";

export interface UserPrimitive {
  readonly id: UserIdPrimitive;
  readonly name: UserNamePrimitive;
  readonly email: EmailPrimitive;
  readonly avatarUrl: AvatarUrlPrimitive | null;
}

export interface UserAttributes {
  readonly id: UserId;
  readonly name: UserName;
  readonly email: Email;
  readonly avatarUrl: AvatarUrl | null;
}

export class User {
  private readonly id: UserId;
  private readonly name: UserName;
  private readonly email: Email;
  private readonly avatarUrl: AvatarUrl | null;

  private constructor(attributes: UserAttributes) {
    this.id = attributes.id;
    this.name = attributes.name;
    this.email = attributes.email;
    this.avatarUrl = attributes.avatarUrl;
  }

  static create(attributes: UserAttributes): User {
    return new User(attributes);
  }

  static fromPrimitive(data: UserPrimitive): User {
    return User.create({
      id: UserId.fromPrimitive(data.id),
      name: UserName.fromPrimitive(data.name),
      email: Email.fromPrimitive(data.email),
      avatarUrl: data.avatarUrl === null ? null : AvatarUrl.fromPrimitive(data.avatarUrl),
    });
  }

  getName(): UserName {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getAvatarUrl(): AvatarUrl | null {
    return this.avatarUrl;
  }

  equals(other: User): boolean {
    return this.id.equals(other.id);
  }

  toPrimitive(): UserPrimitive {
    return {
      id: this.id.toPrimitive(),
      name: this.name.toPrimitive(),
      email: this.email.toPrimitive(),
      avatarUrl: this.avatarUrl?.toPrimitive() ?? null,
    };
  }
}
