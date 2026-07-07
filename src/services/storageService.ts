import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Khởi tạo S3 Client cho Cloudflare R2
// Lưu ý: Các biến môi trường này cần được khai báo trong file .env hoặc cấu hình server
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID || 'your-account-id';
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID || 'your-access-key';
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || 'your-secret-key';
const R2_DOMAIN = import.meta.env.VITE_R2_DOMAIN || 'https://pub-xxxxxx.r2.dev';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const PUBLIC_BUCKET = 'vcom-public-assets';
export const PRIVATE_BUCKET = 'vcom-private-docs';

/**
 * Lấy URL công khai của một file trên R2 (dành cho Public Bucket)
 * @param path Đường dẫn file trong bucket
 * @returns Public URL
 */
export const getPublicUrl = (path: string): string => {
  return `${R2_DOMAIN}/${path}`;
};

/**
 * Lấy Presigned URL để download một file bảo mật (dành cho Private Bucket)
 * @param path Đường dẫn file trong bucket
 * @param expiresIn Thời gian hết hạn của link (giây), mặc định 1 giờ (3600s)
 * @returns Promise chứa Presigned URL
 */
export const getPresignedDownloadUrl = async (path: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: PRIVATE_BUCKET,
      Key: path,
    });
    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    throw error;
  }
};

/**
 * Lấy Presigned URL để upload file trực tiếp từ Frontend lên R2
 * @param path Đường dẫn file sẽ lưu
 * @param bucket Tên bucket (PUBLIC_BUCKET hoặc PRIVATE_BUCKET)
 * @param contentType Loại MIME của file (ví dụ: 'image/jpeg')
 * @returns Promise chứa Presigned URL
 */
export const getPresignedUploadUrl = async (path: string, bucket: string = PUBLIC_BUCKET, contentType: string): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      ContentType: contentType,
    });
    // Link upload thường chỉ sống trong 15 phút (900s)
    return await getSignedUrl(r2Client, command, { expiresIn: 900 });
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    throw error;
  }
};

/**
 * Xoá một file khỏi R2 Bucket
 * @param path Đường dẫn file
 * @param bucket Tên bucket
 */
export const deleteFile = async (path: string, bucket: string = PUBLIC_BUCKET): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: path,
    });
    await r2Client.send(command);
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    throw error;
  }
};

/**
 * Utility: Sinh tên file ngẫu nhiên (tránh trùng lặp)
 */
export const generateUniqueFileName = (originalName: string): string => {
  const ext = originalName.split('.').pop();
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}.${ext}`;
};
