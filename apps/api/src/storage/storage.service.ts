import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private useLocalFallback = false;
  private localDir: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('storage.bucketName', 'dji-raw-flight-logs');
    this.localDir = path.resolve(process.cwd(), 'data', 'raw-logs');
  }

  async onModuleInit() {
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }

    const endpoint = this.configService.get<string>('storage.endpoint');
    const accessKey = this.configService.get<string>('storage.accessKey');
    const secretKey = this.configService.get<string>('storage.secretKey');

    try {
      this.s3Client = new S3Client({
        endpoint,
        region: this.configService.get<string>('storage.region', 'us-east-1'),
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true,
      });

      // Try creating bucket if not exists
      await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName })).catch(() => {});
      this.logger.log(`Initialized S3 storage with bucket: ${this.bucketName}`);
    } catch (err: any) {
      this.useLocalFallback = true;
      this.logger.warn(`S3/MinIO unreachable (${err.message}). Using local disk storage at ${this.localDir}`);
    }
  }

  computeSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<{ storageKey: string; sha256: string; sizeBytes: number }> {
    const sha256 = this.computeSha256(buffer);
    const sizeBytes = buffer.length;

    if (this.s3Client && !this.useLocalFallback) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            Metadata: {
              sha256,
              ...metadata,
            },
          })
        );
        return { storageKey: key, sha256, sizeBytes };
      } catch (err: any) {
        this.logger.warn(`S3 upload failed (${err.message}), falling back to local disk storage`);
      }
    }

    // Local disk storage
    const targetPath = path.join(this.localDir, key.replace(/\//g, '_'));
    await fs.promises.writeFile(targetPath, buffer);
    return { storageKey: `local://${targetPath}`, sha256, sizeBytes };
  }

  async getFile(key: string): Promise<Buffer> {
    if (key.startsWith('local://')) {
      const filePath = key.replace('local://', '');
      return fs.promises.readFile(filePath);
    }

    if (this.s3Client) {
      const res = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      const stream = res.Body as any;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    throw new Error(`Cannot retrieve file for key: ${key}`);
  }
}
