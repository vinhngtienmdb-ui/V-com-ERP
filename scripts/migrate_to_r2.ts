import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Khởi tạo S3 Client cho Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME || 'vcom-erp';

/**
 * Script này dùng để di chuyển toàn bộ file tĩnh (nếu có) từ hệ thống lưu trữ cũ 
 * (ví dụ thư mục public/uploads hoặc server khác) lên Cloudflare R2.
 */
async function migrateDirectory(dirPath: string, prefix = '') {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} does not exist. Skipping...`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const isDirectory = fs.statSync(fullPath).isDirectory();

    if (isDirectory) {
      await migrateDirectory(fullPath, `${prefix}${file}/`);
    } else {
      const s3Key = `${prefix}${file}`;
      console.log(`Uploading ${fullPath} to R2 as ${s3Key}...`);
      
      try {
        const fileContent = fs.readFileSync(fullPath);
        await r2Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
          })
        );
        console.log(`Successfully uploaded: ${s3Key}`);
      } catch (error) {
        console.error(`Failed to upload ${s3Key}:`, error);
      }
    }
  }
}

async function main() {
  console.log('Starting Cloudflare R2 Migration...');
  
  // Vị trí thư mục local cần migrate (Ví dụ: 'public/uploads')
  const localUploadsDir = path.resolve(process.cwd(), 'public/uploads');
  
  await migrateDirectory(localUploadsDir, 'uploads/');
  
  console.log('Migration completed.');
}

main().catch(console.error);
