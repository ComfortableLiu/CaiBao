import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  AttachmentUploadInput,
  AttachmentUploadResult,
  Conversation,
  MessageAttachment,
  ObjectStorageSettings,
  ObjectStorageTestInput,
} from '@shared/types';
import type { SettingsService } from '../storage/settings-service';

function normalizeEndpoint(endpoint: string): string {
  return endpoint.trim().replace(/\/$/, '');
}

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'bin';
}

function normalizedKeyPrefix(settings: ObjectStorageSettings): string {
  return settings.keyPrefix.replace(/^\/+|\/+$/g, '') || 'attachments';
}

export function conversationObjectPrefix(
  settings: ObjectStorageSettings,
  conversationId: string,
): string {
  return `${normalizedKeyPrefix(settings)}/${conversationId}/`;
}

export function buildObjectKey(
  settings: ObjectStorageSettings,
  conversationId: string,
  attachmentId: string,
  mimeType: string,
): string {
  return `${conversationObjectPrefix(settings, conversationId)}${attachmentId}.${extFromMime(mimeType)}`;
}

export function collectAttachmentObjectKeys(conversation: Conversation | null): string[] {
  if (!conversation) return [];
  const keys = new Set<string>();
  for (const message of conversation.messages) {
    for (const att of message.attachments ?? []) {
      const key = att.objectKey?.trim();
      if (key) keys.add(key);
    }
  }
  return [...keys];
}

const S3_DELETE_BATCH_SIZE = 1000;

function canUseObjectStorageClient(os: ObjectStorageSettings): boolean {
  return Boolean(
    os.endpoint.trim() && os.bucket.trim() && os.accessKeyId && os.secretAccessKey,
  );
}

async function deleteS3KeysInBatches(
  client: S3Client,
  bucket: string,
  keys: string[],
): Promise<void> {
  for (let i = 0; i < keys.length; i += S3_DELETE_BATCH_SIZE) {
    const chunk = keys.slice(i, i + S3_DELETE_BATCH_SIZE);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })) },
      }),
    );
  }
}

function publicBase(settings: ObjectStorageSettings): string {
  const base = settings.publicBaseUrl.trim() || settings.endpoint;
  return normalizeEndpoint(base);
}

export function buildPublicObjectUrl(
  settings: ObjectStorageSettings,
  objectKey: string,
): string {
  const base = publicBase(settings);
  if (settings.forcePathStyle) {
    return `${base}/${settings.bucket}/${objectKey}`;
  }
  return `${base}/${objectKey}`;
}

function createClient(settings: ObjectStorageSettings): S3Client {
  return new S3Client({
    endpoint: normalizeEndpoint(settings.endpoint),
    region: settings.region.trim() || 'us-east-1',
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    forcePathStyle: settings.forcePathStyle,
  });
}

function formatObjectStorageError(err: unknown, bucket: string, endpoint: string): Error {
  const status =
    err && typeof err === 'object' && '$metadata' in err
      ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
      : undefined;

  if (status === 404) {
    return new Error(
      `无法访问 Bucket「${bucket}」（HTTP 404）。常见原因：① MinIO 上尚未创建该 bucket；② Endpoint 不是 S3 API 地址（应为类似 ${endpoint}，不要填控制台网页 URL）；③ Bucket 名称拼写错误。`,
    );
  }
  if (status === 403) {
    return new Error('认证失败或无权访问（HTTP 403），请检查 Access Key / Secret Key 及 bucket 策略');
  }
  if (status === 401) {
    return new Error('认证失败（HTTP 401），请检查 Access Key / Secret Key');
  }
  if (err instanceof Error && err.message && err.message !== 'UnknownError') {
    return err;
  }
  return new Error(err instanceof Error ? err.message : '对象存储连接失败');
}

async function getObjectUrl(
  client: S3Client,
  settings: ObjectStorageSettings,
  objectKey: string,
): Promise<string> {
  if (settings.usePresignedUrls) {
    const expiry = Math.max(60, settings.presignedUrlExpirySeconds || 86400);
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: settings.bucket, Key: objectKey }),
      { expiresIn: expiry },
    );
  }
  return buildPublicObjectUrl(settings, objectKey);
}

export class ObjectStorageService {
  constructor(private readonly settingsService: SettingsService) {}

  private async requireStorageSettings(): Promise<ObjectStorageSettings> {
    const settings = await this.settingsService.get();
    if (!settings.objectStorage.enabled) {
      throw new Error('请先在设置中启用对象存储');
    }
    const os = settings.objectStorage;
    if (!os.endpoint.trim() || !os.bucket.trim() || !os.accessKeyId || !os.secretAccessKey) {
      throw new Error('请先在设置中完成对象存储配置');
    }
    return os;
  }

  async testConnection(input: ObjectStorageTestInput): Promise<void> {
    const saved = await this.settingsService.get();
    const secret =
      input.secretAccessKey?.trim() || saved.objectStorage.secretAccessKey;
    if (!input.accessKeyId.trim() || !secret) {
      throw new Error('请填写 Access Key 与 Secret Key');
    }

    const os: ObjectStorageSettings = {
      ...saved.objectStorage,
      endpoint: input.endpoint,
      region: input.region,
      bucket: input.bucket,
      accessKeyId: input.accessKeyId,
      secretAccessKey: secret,
      forcePathStyle: input.forcePathStyle,
    };

    const bucket = os.bucket.trim();
    const client = createClient(os);

    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      return;
    } catch (headErr) {
      const status =
        headErr && typeof headErr === 'object' && '$metadata' in headErr
          ? (headErr as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
          : undefined;

      if (status !== 404) {
        throw formatObjectStorageError(headErr, bucket, os.endpoint);
      }

      // 404：区分「服务可达但 bucket 不存在」与「Endpoint 完全不对」
      try {
        const listed = await client.send(new ListBucketsCommand({}));
        const names = (listed.Buckets ?? [])
          .map((b) => b.Name)
          .filter((n): n is string => Boolean(n));
        if (!names.includes(bucket)) {
          const hint = names.length > 0 ? `当前账号可见的 bucket：${names.join('、')}` : '当前账号下没有任何 bucket';
          throw new Error(
            `Bucket「${bucket}」不存在。请在 MinIO 中创建该 bucket，或修改设置中的 Bucket 名称。${hint}`,
          );
        }
      } catch (listErr) {
        if (listErr instanceof Error && listErr.message.includes('不存在')) {
          throw listErr;
        }
        throw formatObjectStorageError(headErr, bucket, os.endpoint);
      }

      throw formatObjectStorageError(headErr, bucket, os.endpoint);
    }
  }

  async upload(input: AttachmentUploadInput): Promise<AttachmentUploadResult> {
    const os = await this.requireStorageSettings();
    const client = createClient(os);
    const objectKey = buildObjectKey(
      os,
      input.conversationId,
      input.attachmentId,
      input.mimeType,
    );
    const body = Buffer.from(input.dataBase64, 'base64');

    await client.send(
      new PutObjectCommand({
        Bucket: os.bucket,
        Key: objectKey,
        Body: body,
        ContentType: input.mimeType,
      }),
    );

    const url = await getObjectUrl(client, os, objectKey);

    return {
      id: input.attachmentId,
      mimeType: input.mimeType,
      fileName: input.fileName,
      objectKey,
      url,
    };
  }

  async refreshAttachmentUrl(attachment: MessageAttachment): Promise<string> {
    const settings = await this.settingsService.get();
    const os = settings.objectStorage;
    if (!os.enabled || !canUseObjectStorageClient(os)) {
      const existing = attachment.url?.trim();
      if (existing) return existing;
      throw new Error('对象存储未配置，无法刷新图片链接');
    }
    const client = createClient(os);
    return getObjectUrl(client, os, attachment.objectKey);
  }

  /** 删除会话在 S3 下的全部附件（按前缀列举 + 消息里记录的 objectKey 兜底） */
  async deleteConversationAttachments(
    conversationId: string,
    knownObjectKeys: string[] = [],
  ): Promise<void> {
    const settings = await this.settingsService.get();
    const os = settings.objectStorage;
    if (!canUseObjectStorageClient(os)) return;

    const client = createClient(os);
    const prefix = conversationObjectPrefix(os, conversationId);
    const deleted = new Set<string>();

    let continuationToken: string | undefined;
    do {
      const listed = await client.send(
        new ListObjectsV2Command({
          Bucket: os.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const keys = (listed.Contents ?? [])
        .map((o) => o.Key)
        .filter((k): k is string => Boolean(k));

      if (keys.length > 0) {
        await deleteS3KeysInBatches(client, os.bucket, keys);
        for (const key of keys) deleted.add(key);
      }

      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);

    const orphanKeys = knownObjectKeys.filter((k) => !deleted.has(k));
    if (orphanKeys.length > 0) {
      await deleteS3KeysInBatches(client, os.bucket, orphanKeys);
    }
  }

  async deleteByConversationPrefix(conversationId: string): Promise<void> {
    await this.deleteConversationAttachments(conversationId);
  }

  async deleteObjectKeys(objectKeys: string[]): Promise<void> {
    if (objectKeys.length === 0) return;
    const settings = await this.settingsService.get();
    const os = settings.objectStorage;
    if (!canUseObjectStorageClient(os)) return;
    const client = createClient(os);
    await deleteS3KeysInBatches(client, os.bucket, objectKeys);
  }
}
