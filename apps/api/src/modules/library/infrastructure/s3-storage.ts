import type { Readable } from "node:stream";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectStorage } from "../application/ports/index.ts";
import type { Config } from "../../../shared/infrastructure/config.ts";

export class S3Storage implements ObjectStorage {
  #client: S3Client;
  #signer: S3Client;
  #bucket: string;

  constructor(config: Config["s3"]) {
    const base = {
      region: config.region,
      forcePathStyle: true,
      // Default CRC32 checksums end up in presigned URLs, which browsers cannot satisfy.
      requestChecksumCalculation: "WHEN_REQUIRED" as const,
      responseChecksumValidation: "WHEN_REQUIRED" as const,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    };
    this.#client = new S3Client({ ...base, endpoint: config.endpoint });
    this.#signer = new S3Client({ ...base, endpoint: config.publicEndpoint });
    this.#bucket = config.bucket;
  }

  presignUpload(key: string, contentType: string, expiresIn: number): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.#bucket, Key: key, ContentType: contentType });
    return getSignedUrl(this.#signer, command, { expiresIn });
  }

  presignDownload(key: string, expiresIn: number, filename?: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.#bucket,
      Key: key,
      ResponseContentDisposition: filename ? `attachment; filename*=UTF-8''${encodeURIComponent(filename)}` : undefined,
    });
    return getSignedUrl(this.#signer, command, { expiresIn });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.#client.send(new HeadObjectCommand({ Bucket: this.#bucket, Key: key }));
      return true;
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return false;
      throw error;
    }
  }

  async read(key: string): Promise<Readable> {
    const out = await this.#client.send(new GetObjectCommand({ Bucket: this.#bucket, Key: key }));
    return out.Body as Readable;
  }

  async deletePrefix(prefix: string): Promise<void> {
    let token: string | undefined;
    do {
      const page = await this.#client.send(
        new ListObjectsV2Command({ Bucket: this.#bucket, Prefix: prefix, ContinuationToken: token }),
      );
      const keys = (page.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
      if (keys.length > 0) {
        await this.#client.send(new DeleteObjectsCommand({ Bucket: this.#bucket, Delete: { Objects: keys } }));
      }
      token = page.NextContinuationToken;
    } while (token);
  }

  async ping(): Promise<void> {
    await this.#client.send(new ListObjectsV2Command({ Bucket: this.#bucket, MaxKeys: 1 }));
  }
}
