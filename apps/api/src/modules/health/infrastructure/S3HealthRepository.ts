import { ListObjectsV2Command, type S3Client } from "@aws-sdk/client-s3";
import { createS3Client, type S3Settings } from "../../shared/infrastructure/s3Client.ts";
import type { HealthRepository } from "../domain/HealthRepository.ts";

export class S3HealthRepository implements HealthRepository {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(settings: S3Settings) {
    this.client = createS3Client(settings);
    this.bucket = settings.bucket;
  }

  async ping(): Promise<void> {
    await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
  }
}
