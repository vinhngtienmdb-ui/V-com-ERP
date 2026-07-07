const fs = require('fs');
let content = fs.readFileSync('C:/Users/VINHNT/.gemini/antigravity/brain/aebdefca-7b56-4523-b397-41ac2a7844bb/walkthrough.md', 'utf8');

content += `

## Tích hợp Cloudflare R2 để lưu trữ tài liệu
- **Lưu trữ tĩnh mới**: Toàn bộ chức năng tải lên file (Upload) trong hệ thống giờ đây đã được kết nối với API của Cloudflare R2 thay vì lưu trữ trên server nhằm cải thiện tốc độ tải toàn cầu và độ tin cậy.
- **Service API**: \`src/services/storageService.ts\` quản lý các thao tác tải lên và lấy link S3/R2 tương ứng.
- **Migration Script**: Script \`scripts/migrate_to_r2.ts\` đã được tạo ra để bạn có thể tự động upload toàn bộ ảnh và file cũ từ máy chủ (hoặc thư mục local \`public/uploads\`) lên bucket mới. Bạn chỉ cần chạy bằng \`npx ts-node scripts/migrate_to_r2.ts\` (sau khi cài đặt \`@aws-sdk/client-s3\`).
`;

fs.writeFileSync('C:/Users/VINHNT/.gemini/antigravity/brain/aebdefca-7b56-4523-b397-41ac2a7844bb/walkthrough.md', content, 'utf8');
console.log('Walkthrough updated for R2');
