import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as mime from 'mime-types'; // Changed import style
import { contabo_config } from './contabo-config';

// Initialize Contabo S3 Client
const s3 = new S3Client({
  endpoint: contabo_config.CONTABO_ENDPOINT,
  credentials: {
    accessKeyId: contabo_config.CONTABO_ACCESS_KEY,
    secretAccessKey: contabo_config.CONTABO_SECRET_KEY,
  },
  region: contabo_config.CONTABO_REGION,
  forcePathStyle: true,
});

const bucketName = contabo_config.CONTABO_BUCKET_NAME;

export const uploadFileToContabo = async (
  fileBuffer: Buffer,
  originalName: string,
): Promise<string> => {
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new TypeError('fileBuffer must be a Buffer');
  }

  if (!originalName || typeof originalName !== 'string') {
    throw new TypeError('originalName must be a non-empty string');
  }

  // Auto-detect content type with fallback
  const contentType = mime.lookup(originalName) || 'application/octet-stream';
  if (!contentType) {
    throw new Error('Could not determine content type');
  }

  const extension = path.extname(originalName);
  const fileKey = `${randomUUID()}${extension}`;

  try {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read',
      },
    });

    await upload.done();

    const publicUrl = `https://eu2.contabostorage.com/${contabo_config.CONTABO_IDENTIFIER}:${contabo_config.CONTABO_BUCKET_NAME}/${contabo_config.CONTABO_BUCKET_NAME}/${fileKey}`;

    return publicUrl;
  } catch (error) {
    console.error('Contabo Upload Error:', error);
    throw new Error(`Failed to upload file to Contabo: ${error.message}`);
  }
};
