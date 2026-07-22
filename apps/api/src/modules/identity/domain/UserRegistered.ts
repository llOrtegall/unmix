import { DomainEvent, type DomainEventPrimitive } from "../../shared/domain/DomainEvent.ts";
import { EventId } from "../../shared/domain/EventId.ts";
import { OccurredAt } from "../../shared/domain/OccurredAt.ts";
import { UserId, type UserIdPrimitive } from "../../shared/domain/UserId.ts";

export interface UserRegisteredPayload {
  readonly userId: UserIdPrimitive;
}

export type UserRegisteredPrimitive = DomainEventPrimitive<UserRegisteredPayload>;

export class UserRegistered extends DomainEvent<UserRegisteredPayload> {
  static readonly TYPE = "identity.user_registered";

  private readonly userId: UserId;

  private constructor(id: EventId, occurredAt: OccurredAt, userId: UserId) {
    super(UserRegistered.TYPE, id, occurredAt);
    this.userId = userId;
  }

  static create(id: EventId, occurredAt: OccurredAt, userId: UserId): UserRegistered {
    return new UserRegistered(id, occurredAt, userId);
  }

  static occur(userId: UserId): UserRegistered {
    return UserRegistered.create(EventId.generate(), OccurredAt.now(), userId);
  }

  static fromPrimitive(data: UserRegisteredPrimitive): UserRegistered {
    UserRegistered.ensureTypeIs(UserRegistered.TYPE, data.type);
    return UserRegistered.create(
      EventId.fromPrimitive(data.id),
      OccurredAt.fromPrimitive(data.occurredAt),
      UserId.fromPrimitive(data.payload.userId),
    );
  }

  protected toPayloadPrimitive(): UserRegisteredPayload {
    return { userId: this.userId.toPrimitive() };
  }
}
