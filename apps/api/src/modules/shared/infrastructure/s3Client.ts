import { S3Client } from "@aws-sdk/client-s3";

export interface S3Settings {
  readonly endpoint: string;
  readonly publicEndpoint: string;
  readonly region: string;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly bucket: string;
}

export const createS3Client = (settings: S3Settings, endpoint: string = settings.endpoint): S3Client =>
  new S3Client({
    endpoint,
    region: settings.region,
    forcePathStyle: true,
    // Default CRC32 checksums end up in presigned URLs, which browsers cannot satisfy.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId: settings.accessKey, secretAccessKey: settings.secretKey },
  });
