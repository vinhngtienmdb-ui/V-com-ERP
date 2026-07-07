const fs = require('fs');
let content = fs.readFileSync('C:/Users/VINHNT/.gemini/antigravity/brain/aebdefca-7b56-4523-b397-41ac2a7844bb/walkthrough.md', 'utf8');

content += `

## Tích hợp Chatwoot (Omnichannel)
Hệ thống CSKH nay đã được kết nối với [Chatwoot](https://github.com/chatwoot/chatwoot) thông qua giao thức Headless API.
- **Service API**: \`src/services/chatwootService.ts\` chịu trách nhiệm xử lý các nghiệp vụ fetch hội thoại, nhắn tin đa kênh.
- **Giao diện OmniChat**: Đã được làm sạch, loại bỏ hoàn toàn Fake Data/Mock Data. Giao diện giờ đây sẽ hiển thị thông tin Live Data lấy trực tiếp từ Chatwoot.
- Để sử dụng, hãy thiết lập các biến môi trường \`VITE_CHATWOOT_BASE_URL\`, \`VITE_CHATWOOT_ACCESS_TOKEN\` và \`VITE_CHATWOOT_ACCOUNT_ID\`.
`;

fs.writeFileSync('C:/Users/VINHNT/.gemini/antigravity/brain/aebdefca-7b56-4523-b397-41ac2a7844bb/walkthrough.md', content, 'utf8');
console.log('Walkthrough updated');
