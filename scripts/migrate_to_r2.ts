import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Mô phỏng __dirname trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load biến môi trường từ file .env ở thư mục gốc
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const R2_ACCOUNT_ID = process.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("❌ Thiếu cấu hình R2 trong file .env!");
  console.error("Vui lòng đảm bảo VITE_R2_ACCOUNT_ID, VITE_R2_ACCESS_KEY_ID, VITE_R2_SECRET_ACCESS_KEY đã được thiết lập.");
  process.exit(1);
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const PUBLIC_BUCKET = 'vcom-public-assets';

// Thư mục chứa các file mẫu muốn migrate lên R2
const SOURCE_DIR = path.resolve(__dirname, '../public/images');

async function uploadFileToR2(filePath: string, r2Key: string) {
  const fileStream = fs.createReadStream(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.svg') contentType = 'image/svg+xml';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.pdf') contentType = 'application/pdf';

  try {
    const command = new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: r2Key,
      Body: fileStream,
      ContentType: contentType,
    });
    
    await r2Client.send(command);
    console.log(`✅ Uploaded: ${r2Key}`);
  } catch (error) {
    console.error(`❌ Lỗi upload ${filePath}:`, error);
  }
}

async function migrateData() {
  console.log('🚀 Bắt đầu quá trình Migration dữ liệu lên Cloudflare R2...\n');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.warn(`⚠️ Thư mục nguồn không tồn tại: ${SOURCE_DIR}`);
    console.log('Bỏ qua tiến trình quét thư mục cục bộ.');
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR);
  let uploadCount = 0;

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      // Đặt file vào thư mục r2 (ví dụ: products/)
      const r2Key = `migrated/${file}`;
      await uploadFileToR2(filePath, r2Key);
      uploadCount++;
    }
  }

  console.log(`\n🎉 Quá trình Migrate hoàn tất. Đã upload ${uploadCount} files.`);
}

migrateData();
