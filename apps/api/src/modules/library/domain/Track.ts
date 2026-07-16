import { JobId, type JobIdPrimitive } from "../../shared/domain/JobId.ts";
import { ObjectKey, type ObjectKeyPrimitive } from "../../shared/domain/ObjectKey.ts";
import { UserId, type UserIdPrimitive } from "../../shared/domain/UserId.ts";
import { CreatedAt, type CreatedAtPrimitive } from "./CreatedAt.ts";
import { Credit, type CreditPrimitive } from "./Credit.ts";
import type { DemoSong } from "./DemoSong.ts";
import { FileTooLargeError } from "./errors/FileTooLargeError.ts";
import { InvalidTrackTransitionError } from "./errors/InvalidTrackTransitionError.ts";
import { StemsNotReadyError } from "./errors/StemsNotReadyError.ts";
import { TrackBusyError } from "./errors/TrackBusyError.ts";
import { FileSize, type FileSizePrimitive } from "./FileSize.ts";
import { MediaType, type MediaTypePrimitive } from "./MediaType.ts";
import { OriginalFilename, type OriginalFilenamePrimitive } from "./OriginalFilename.ts";
import { StemList, type StemListPrimitive } from "./StemList.ts";
import { TrackDuration, type TrackDurationPrimitive } from "./TrackDuration.ts";
import { TrackFolder } from "./TrackFolder.ts";
import { TrackId, type TrackIdPrimitive } from "./TrackId.ts";
import { TrackStatus, type TrackStatusPrimitive } from "./TrackStatus.ts";
import { TrackTitle, type TrackTitlePrimitive } from "./TrackTitle.ts";

export interface TrackPrimitive {
  readonly id: TrackIdPrimitive;
  readonly ownerId: UserIdPrimitive;
  readonly title: TrackTitlePrimitive;
  readonly originalFilename: OriginalFilenamePrimitive;
  readonly mediaType: MediaTypePrimitive;
  readonly sizeBytes: FileSizePrimitive;
  readonly inputKey: ObjectKeyPrimitive;
  readonly status: TrackStatusPrimitive;
  readonly durationSeconds: TrackDurationPrimitive | null;
  readonly latestJobId: JobIdPrimitive | null;
  readonly stems: StemListPrimitive;
  readonly credit: CreditPrimitive | null;
  readonly createdAt: CreatedAtPrimitive;
}

export interface TrackAttributes {
  readonly id: TrackId;
  readonly ownerId: UserId;
  readonly title: TrackTitle;
  readonly originalFilename: OriginalFilename;
  readonly mediaType: MediaType;
  readonly size: FileSize;
  readonly inputKey: ObjectKey;
  readonly status: TrackStatus;
  readonly duration: TrackDuration | null;
  readonly latestJobId: JobId | null;
  readonly stems: StemList;
  readonly credit: Credit | null;
  readonly createdAt: CreatedAt;
}

export interface TrackRegistration {
  readonly ownerId: UserId;
  readonly filename: OriginalFilename;
  readonly mediaType: MediaType;
  readonly size: FileSize;
  readonly uploadLimit: FileSize;
}

export interface SeparationOutcome {
  readonly jobId: JobId;
  readonly duration: TrackDuration;
  readonly stems: StemList;
}

export class Track {
  static readonly ABANDONED_UPLOAD_HOURS = 24;

  private readonly id: TrackId;
  private readonly ownerId: UserId;
  private readonly title: TrackTitle;
  private readonly originalFilename: OriginalFilename;
  private readonly mediaType: MediaType;
  private readonly size: FileSize;
  private readonly inputKey: ObjectKey;
  private readonly status: TrackStatus;
  private readonly duration: TrackDuration | null;
  private readonly latestJobId: JobId | null;
  private readonly stems: StemList;
  private readonly credit: Credit | null;
  private readonly createdAt: CreatedAt;

  private constructor(attributes: TrackAttributes) {
    this.id = attributes.id;
    this.ownerId = attributes.ownerId;
    this.title = attributes.title;
    this.originalFilename = attributes.originalFilename;
    this.mediaType = attributes.mediaType;
    this.size = attributes.size;
    this.inputKey = attributes.inputKey;
    this.status = attributes.status;
    this.duration = attributes.duration;
    this.latestJobId = attributes.latestJobId;
    this.stems = attributes.stems;
    this.credit = attributes.credit;
    this.createdAt = attributes.createdAt;
  }

  static create(attributes: TrackAttributes): Track {
    return new Track(attributes);
  }

  static register({ ownerId, filename, mediaType, size, uploadLimit }: TrackRegistration): Track {
    Track.ensureFitsUploadLimit(size, uploadLimit);
    const id = TrackId.generate();
    return Track.create({
      id,
      ownerId,
      title: TrackTitle.fromFilename(filename),
      originalFilename: filename,
      mediaType,
      size,
      inputKey: TrackFolder.create(id).child(`original${mediaType.getExtension()}`),
      status: TrackStatus.awaitingUpload(),
      duration: null,
      latestJobId: null,
      stems: StemList.empty(),
      credit: null,
      createdAt: CreatedAt.now(),
    });
  }

  static fromDemo(ownerId: UserId, demo: DemoSong): Track {
    return Track.create({
      id: TrackId.generate(),
      ownerId,
      title: demo.getTitle(),
      originalFilename: demo.getOriginalFilename(),
      mediaType: demo.getMediaType(),
      size: demo.getSize(),
      inputKey: demo.getInputKey(),
      status: TrackStatus.completed(),
      duration: demo.getDuration(),
      latestJobId: null,
      stems: demo.getStems(),
      credit: demo.getCredit(),
      createdAt: CreatedAt.now(),
    });
  }

  static fromPrimitive(data: TrackPrimitive): Track {
    return Track.create({
      id: TrackId.fromPrimitive(data.id),
      ownerId: UserId.fromPrimitive(data.ownerId),
      title: TrackTitle.fromPrimitive(data.title),
      originalFilename: OriginalFilename.fromPrimitive(data.originalFilename),
      mediaType: MediaType.fromPrimitive(data.mediaType),
      size: FileSize.fromPrimitive(data.sizeBytes),
      inputKey: ObjectKey.fromPrimitive(data.inputKey),
      status: TrackStatus.fromPrimitive(data.status),
      duration: data.durationSeconds === null ? null : TrackDuration.fromPrimitive(data.durationSeconds),
      latestJobId: data.latestJobId === null ? null : JobId.fromPrimitive(data.latestJobId),
      stems: StemList.fromPrimitive(data.stems),
      credit: data.credit === null ? null : Credit.fromPrimitive(data.credit),
      createdAt: CreatedAt.fromPrimitive(data.createdAt),
    });
  }

  static abandonedUploadCutoff(): CreatedAt {
    return CreatedAt.hoursAgo(Track.ABANDONED_UPLOAD_HOURS);
  }

  private static ensureFitsUploadLimit(size: FileSize, uploadLimit: FileSize): void {
    if (size.isLargerThan(uploadLimit)) throw new FileTooLargeError(uploadLimit.toMegabytes());
  }

  getId(): TrackId {
    return this.id;
  }

  getTitle(): TrackTitle {
    return this.title;
  }

  getMediaType(): MediaType {
    return this.mediaType;
  }

  getInputKey(): ObjectKey {
    return this.inputKey;
  }

  getStems(): StemList {
    return this.stems;
  }

  getCreatedAt(): CreatedAt {
    return this.createdAt;
  }

  getFolder(): TrackFolder {
    return TrackFolder.create(this.id);
  }

  getStemsPrefix(): ObjectKey {
    return this.getFolder().child("stems");
  }

  isOwnedBy(userId: UserId): boolean {
    return this.ownerId.equals(userId);
  }

  ensureCanStartSeparation(): void {
    if (!this.status.allowsNewSeparation()) throw new TrackBusyError(this.id.toPrimitive());
  }

  ensureCanBeDeleted(): void {
    if (this.status.isSeparating()) throw new TrackBusyError(this.id.toPrimitive());
  }

  ensureStemsAreReady(): void {
    if (!this.status.isCompleted()) throw new StemsNotReadyError(this.id.toPrimitive());
  }

  startSeparation(jobId: JobId): Track {
    this.ensureCanStartSeparation();
    return Track.create({ ...this.attributes(), status: TrackStatus.separating(), latestJobId: jobId, stems: StemList.empty() });
  }

  completeSeparation({ jobId, duration, stems }: SeparationOutcome): Track {
    if (!this.isLatestJob(jobId) || this.status.isCompleted()) return this;
    this.ensureIsSeparating(TrackStatus.completed());
    return Track.create({ ...this.attributes(), status: TrackStatus.completed(), duration, stems });
  }

  failSeparation(jobId: JobId): Track {
    if (!this.isLatestJob(jobId) || !this.status.isSeparating()) return this;
    return Track.create({ ...this.attributes(), status: TrackStatus.failed() });
  }

  private isLatestJob(jobId: JobId): boolean {
    return this.latestJobId?.equals(jobId) ?? false;
  }

  private ensureIsSeparating(next: TrackStatus): void {
    if (!this.status.isSeparating()) {
      throw new InvalidTrackTransitionError(this.id.toPrimitive(), this.status.toPrimitive(), next.toPrimitive());
    }
  }

  private attributes(): TrackAttributes {
    return {
      id: this.id,
      ownerId: this.ownerId,
      title: this.title,
      originalFilename: this.originalFilename,
      mediaType: this.mediaType,
      size: this.size,
      inputKey: this.inputKey,
      status: this.status,
      duration: this.duration,
      latestJobId: this.latestJobId,
      stems: this.stems,
      credit: this.credit,
      createdAt: this.createdAt,
    };
  }

  equals(other: Track): boolean {
    return this.id.equals(other.id);
  }

  toPrimitive(): TrackPrimitive {
    return {
      id: this.id.toPrimitive(),
      ownerId: this.ownerId.toPrimitive(),
      title: this.title.toPrimitive(),
      originalFilename: this.originalFilename.toPrimitive(),
      mediaType: this.mediaType.toPrimitive(),
      sizeBytes: this.size.toPrimitive(),
      inputKey: this.inputKey.toPrimitive(),
      status: this.status.toPrimitive(),
      durationSeconds: this.duration?.toPrimitive() ?? null,
      latestJobId: this.latestJobId?.toPrimitive() ?? null,
      stems: this.stems.toPrimitive(),
      credit: this.credit?.toPrimitive() ?? null,
      createdAt: this.createdAt.toPrimitive(),
    };
  }
}
