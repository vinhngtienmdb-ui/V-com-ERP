# VComm ERP — Cloud Functions

Backend của VComm ERP chạy trên Cloud Functions for Firebase (Gen 2), region `asia-southeast1`.

## Functions

### HTTPS (yêu cầu Authorization: Bearer <Firebase ID token>)

| Function | Route Hosting | Mô tả |
|---|---|---|
| `aiChat`               | `/api/ai/chat`              | Trợ lý AI nội bộ |
| `aiRma`                | `/api/ai/rma`               | Soạn phản hồi RMA |
| `aiCare`               | `/api/ai/care`              | Soạn tin chăm sóc khách hàng |
| `sepayTransactions`    | `/api/sepay/transactions`   | Lịch sử giao dịch ngân hàng |
| `sepayVirtualAccount`  | `/api/sepay/virtual-account`| Tạo VA cho 1 đơn |
| `sepaySoundbox`        | `/api/sepay/soundbox`       | Trigger SoundBox |
| `sepayInvoice`         | `/api/sepay/invoice`        | Tạo hóa đơn điện tử |
| `sepayWebhook`         | `/api/sepay-webhook`        | Webhook SePay (HMAC verify, KHÔNG auth) |
| `health`               | `/api/health`               | Healthcheck (no auth) |

### Firestore triggers (background)

`auditProducts`, `auditOrders`, `auditTransactions`, `auditStaff`, `auditStores`, `auditCustomers`, `auditSepayEvents` — ghi `audit_logs/{auto}` mỗi khi có thay đổi (create/update/delete) cho từng collection nhạy cảm. Audit log là immutable (client deny write).

## Secrets

Quản lý qua Google Secret Manager:

```sh
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set SEPAY_API_TOKEN
firebase functions:secrets:set SEPAY_WEBHOOK_SECRET
```

Khi deploy, function sẽ tự đọc secret từ Secret Manager, không cần `.env` chứa secret.

## Phát triển

```sh
cd functions
npm install
npm run build           # tsc → lib/
npm run serve           # functions emulator (port 5001)
firebase emulators:start # tất cả emulators (auth + firestore + functions + ui)
```

## Deploy

```sh
firebase deploy --only functions
# hoặc deploy một function cụ thể:
firebase deploy --only functions:aiChat
```

## Logs

```sh
firebase functions:log
firebase functions:log --only aiChat
```
