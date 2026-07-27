import { CreatedAt, type CreatedAtPrimitive } from "./CreatedAt.ts";
import { Credit, type CreditPrimitive } from "./Credit.ts";
import { Duration, type DurationPrimitive } from "./Duration.ts";
import { TrackId, type TrackIdPrimitive } from "./TrackId.ts";
import { TrackStatus, type TrackStatusPrimitive } from "./TrackStatus.ts";
import { TrackTitle, type TrackTitlePrimitive } from "./TrackTitle.ts";

export interface TrackSummaryPrimitive {
  readonly id: TrackIdPrimitive;
  readonly title: TrackTitlePrimitive;
  readonly status: TrackStatusPrimitive;
  readonly durationSeconds: DurationPrimitive | null;
  readonly credit: CreditPrimitive | null;
  readonly createdAt: CreatedAtPrimitive;
}

export interface TrackSummaryAttributes {
  readonly id: TrackId;
  readonly title: TrackTitle;
  readonly status: TrackStatus;
  readonly duration: Duration | null;
  readonly credit: Credit | null;
  readonly createdAt: CreatedAt;
}

export class TrackSummary {
  private readonly id: TrackId;
  private readonly title: TrackTitle;
  private readonly status: TrackStatus;
  private readonly duration: Duration | null;
  private readonly credit: Credit | null;
  private readonly createdAt: CreatedAt;

  private constructor(attributes: TrackSummaryAttributes) {
    this.id = attributes.id;
    this.title = attributes.title;
    this.status = attributes.status;
    this.duration = attributes.duration;
    this.credit = attributes.credit;
    this.createdAt = attributes.createdAt;
  }

  static create(attributes: TrackSummaryAttributes): TrackSummary {
    return new TrackSummary(attributes);
  }

  static fromPrimitive(data: TrackSummaryPrimitive): TrackSummary {
    return TrackSummary.create({
      id: TrackId.fromPrimitive(data.id),
      title: TrackTitle.fromPrimitive(data.title),
      status: TrackStatus.fromPrimitive(data.status),
      duration: data.durationSeconds === null ? null : Duration.fromPrimitive(data.durationSeconds),
      credit: data.credit === null ? null : Credit.fromPrimitive(data.credit),
      createdAt: CreatedAt.fromPrimitive(data.createdAt),
    });
  }

  getId(): TrackId {
    return this.id;
  }

  getTitle(): TrackTitle {
    return this.title;
  }

  getStatus(): TrackStatus {
    return this.status;
  }

  getDuration(): Duration | null {
    return this.duration;
  }

  getCredit(): Credit | null {
    return this.credit;
  }

  getCreatedAt(): CreatedAt {
    return this.createdAt;
  }

  isSeparating(): boolean {
    return this.status.isSeparating();
  }

  isDemo(): boolean {
    return this.credit !== null;
  }

  canBeDeleted(): boolean {
    return !this.isSeparating();
  }

  equals(other: TrackSummary): boolean {
    return this.id.equals(other.id);
  }

  toPrimitive(): TrackSummaryPrimitive {
    return {
      id: this.id.toPrimitive(),
      title: this.title.toPrimitive(),
      status: this.status.toPrimitive(),
      durationSeconds: this.duration?.toPrimitive() ?? null,
      credit: this.credit?.toPrimitive() ?? null,
      createdAt: this.createdAt.toPrimitive(),
    };
  }
}
