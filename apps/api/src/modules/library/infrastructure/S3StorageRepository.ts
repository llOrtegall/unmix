import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ObjectKey } from "../../shared/domain/ObjectKey.ts";
import type { MediaType } from "../domain/MediaType.ts";
import { SignedUrl } from "../domain/SignedUrl.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";
import { TrackFolder } from "../domain/TrackFolder.ts";
import { TrackFolderList } from "../domain/TrackFolderList.ts";
import type { UrlLifetime } from "../domain/UrlLifetime.ts";

const NOT_FOUND = 404;
const FOLDER_DELIMITER = "/";

export interface S3Settings {
  readonly endpoint: string;
  readonly publicEndpoint: string;
  readonly region: string;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly bucket: string;
}

export class S3StorageRepository implements StorageRepository {
  private readonly client: S3Client;
  private readonly signer: S3Client;
  private readonly bucket: string;

  constructor(settings: S3Settings) {
    const base = {
      region: settings.region,
      forcePathStyle: true,
      // Default CRC32 checksums end up in presigned URLs, which browsers cannot satisfy.
      requestChecksumCalculation: "WHEN_REQUIRED" as const,
      responseChecksumValidation: "WHEN_REQUIRED" as const,
      credentials: { accessKeyId: settings.accessKey, secretAccessKey: settings.secretKey },
    };
    this.client = new S3Client({ ...base, endpoint: settings.endpoint });
    this.signer = new S3Client({ ...base, endpoint: settings.publicEndpoint });
    this.bucket = settings.bucket;
  }

  async signUpload(key: ObjectKey, mediaType: MediaType, lifetime: UrlLifetime): Promise<SignedUrl> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key.toPrimitive(), ContentType: mediaType.toPrimitive() });
    return SignedUrl.create(await getSignedUrl(this.signer, command, { expiresIn: lifetime.toPrimitive() }));
  }

  async signDownload(key: ObjectKey, lifetime: UrlLifetime, filename?: string): Promise<SignedUrl> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key.toPrimitive(),
      ResponseContentDisposition: filename ? `attachment; filename*=UTF-8''${encodeURIComponent(filename)}` : undefined,
    });
    return SignedUrl.create(await getSignedUrl(this.signer, command, { expiresIn: lifetime.toPrimitive() }));
  }

  async exists(key: ObjectKey): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key.toPrimitive() }));
      return true;
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === NOT_FOUND) return false;
      throw error;
    }
  }

  async read(key: ObjectKey): Promise<ReadableStream<Uint8Array>> {
    const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key.toPrimitive() }));
    return object.Body!.transformToWebStream() as ReadableStream<Uint8Array>;
  }

  async deleteFolder(folder: TrackFolder): Promise<void> {
    let token: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: folder.toPrimitive(), ContinuationToken: token }),
      );
      const objects = (page.Contents ?? []).flatMap((object) => (object.Key ? [{ Key: object.Key }] : []));
      if (objects.length > 0) {
        await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: objects } }));
      }
      token = page.NextContinuationToken;
    } while (token);
  }

  async findTrackFolders(): Promise<TrackFolderList> {
    const keys: ObjectKey[] = [];
    let token: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: TrackFolder.root().toPrimitive(),
          Delimiter: FOLDER_DELIMITER,
          ContinuationToken: token,
        }),
      );
      for (const prefix of page.CommonPrefixes ?? []) if (prefix.Prefix) keys.push(ObjectKey.create(prefix.Prefix));
      token = page.NextContinuationToken;
    } while (token);
    return TrackFolderList.fromKeys(keys);
  }

  async ping(): Promise<void> {
    await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
  }
}
