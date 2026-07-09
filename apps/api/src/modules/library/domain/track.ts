import { AggregateRoot } from "../../../shared/kernel/domain-event.ts";
import { err, ok, type Result } from "../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "./errors.ts";
import { MediaType } from "./media-type.ts";
import type { Stem } from "./stem.ts";

export type TrackStatus = "awaiting_upload" | "uploaded" | "separating" | "completed" | "failed";

export interface TrackProps {
  id: string;
  ownerId: string;
  title: string;
  originalFilename: string;
  mediaType: MediaType;
  sizeBytes: number;
  inputKey: string;
  status: TrackStatus;
  durationSeconds: number | null;
  latestJobId: string | null;
  stems: Stem[];
  /** Attribution for licensed content (the demo song); null for uploads. */
  credit: string | null;
  createdAt: Date;
}

export interface RegisterTrack {
  id: string;
  ownerId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  maxSizeBytes: number;
  now: Date;
}

/** A song already separated, shared by every user's demo track (files are never copied). */
export interface DemoSong {
  title: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  inputKey: string;
  durationSeconds: number;
  credit: string;
  stems: Stem[];
}

export class Track extends AggregateRoot {
  #props: TrackProps;

  private constructor(props: TrackProps) {
    super();
    this.#props = props;
  }

  static register(input: RegisterTrack): Result<Track, LibraryError> {
    const mediaType = MediaType.create(input.contentType);
    if (mediaType.isErr()) return err(mediaType.error);
    if (input.sizeBytes > input.maxSizeBytes) {
      const limitMb = Math.round(input.maxSizeBytes / 1_048_576);
      return err(libraryError("FILE_TOO_LARGE", `The file exceeds the ${limitMb} MB limit.`));
    }
    return ok(
      new Track({
        id: input.id,
        ownerId: input.ownerId,
        title: titleFrom(input.filename),
        originalFilename: input.filename,
        mediaType: mediaType.value,
        sizeBytes: input.sizeBytes,
        inputKey: `tracks/${input.id}/original${mediaType.value.extension}`,
        status: "awaiting_upload",
        durationSeconds: null,
        latestJobId: null,
        stems: [],
        credit: null,
        createdAt: input.now,
      }),
    );
  }

  /** A ready-to-play copy of the demo song for one user. */
  static fromDemo(input: { id: string; ownerId: string; demo: DemoSong; now: Date }): Track {
    const { demo } = input;
    return new Track({
      id: input.id,
      ownerId: input.ownerId,
      title: demo.title,
      originalFilename: demo.originalFilename,
      mediaType: MediaType.restore(demo.contentType),
      sizeBytes: demo.sizeBytes,
      inputKey: demo.inputKey,
      status: "completed",
      durationSeconds: demo.durationSeconds,
      latestJobId: null,
      stems: [...demo.stems],
      credit: demo.credit,
      createdAt: input.now,
    });
  }

  static restore(props: TrackProps): Track {
    return new Track(props);
  }

  get id(): string {
    return this.#props.id;
  }

  isOwnedBy(userId: string): boolean {
    return this.#props.ownerId === userId;
  }

  get stemsPrefix(): string {
    return `tracks/${this.#props.id}/stems`;
  }

  /** Whether a new separation may start (the caller verifies the upload exists). */
  canStartSeparation(): Result<void, LibraryError> {
    if (["awaiting_upload", "uploaded", "failed"].includes(this.#props.status)) return ok(undefined);
    return err(libraryError("TRACK_BUSY", `Track is ${this.#props.status}.`));
  }

  startSeparation(jobId: string): Result<void, LibraryError> {
    const allowed = this.canStartSeparation();
    if (allowed.isErr()) return allowed;
    this.#props.status = "separating";
    this.#props.latestJobId = jobId;
    this.#props.stems = [];
    return ok(undefined);
  }

  completeSeparation(jobId: string, durationSeconds: number, stems: Stem[]): Result<void, LibraryError> {
    if (this.#props.latestJobId !== jobId) return ok(undefined); // stale job: ignore
    if (this.#props.status === "completed") return ok(undefined); // duplicate delivery
    if (this.#props.status !== "separating") {
      return err(libraryError("INVALID_STATE", `Cannot complete a ${this.#props.status} track.`));
    }
    const names = new Set(stems.map((s) => s.name));
    if (names.size !== stems.length) {
      return err(libraryError("INVALID_STATE", "Duplicate stem names."));
    }
    this.#props.status = "completed";
    this.#props.durationSeconds = durationSeconds;
    this.#props.stems = stems;
    return ok(undefined);
  }

  failSeparation(jobId: string): void {
    if (this.#props.latestJobId !== jobId || this.#props.status !== "separating") return;
    this.#props.status = "failed";
  }

  canDelete(): Result<void, LibraryError> {
    if (this.#props.status === "separating") {
      return err(libraryError("TRACK_BUSY", "Wait until the separation finishes."));
    }
    return ok(undefined);
  }

  toSnapshot(): Readonly<TrackProps> {
    return { ...this.#props, stems: [...this.#props.stems] };
  }
}

function titleFrom(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base || filename;
}
