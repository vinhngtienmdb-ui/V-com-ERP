# VComm ERP — Runbook vận hành

Tham chiếu nhanh cho setup ban đầu + 5 sự cố phổ biến.

---

## Setup production lần đầu

### 0. Pre-flight check

```sh
firebase --version            # cần >= 15.x
firebase projects:list        # phải thấy vcomm-erp-prod
firebase use vcomm-erp-prod
gsutil --version              # nếu chưa có: cài Google Cloud SDK
gcloud auth login             # đăng nhập Google Cloud (1 lần)
gcloud config set project vcomm-erp-prod
```

### 1. CI auto-deploy — sinh FIREBASE_TOKEN

```sh
firebase login:ci             # mở browser, login → copy token in ra
```

Sau đó add vào GitHub repo secrets:

- Mở https://github.com/vinhngtienmdb-ui/V-com-ERP/settings/secrets/actions
- Bấm "New repository secret"
- Name: `FIREBASE_TOKEN`, Value: paste token vừa lấy
- (Optional) thêm `VITE_SENTRY_DSN` nếu đã setup Sentry

Sau khi set: push commit bất kỳ vào `main` → GitHub Actions tự deploy.
Để skip deploy 1 commit: `git commit -m "doc: ... [skip deploy]"`.

### 2. Set 3 secrets thật cho Cloud Functions

```sh
firebase functions:secrets:set GEMINI_API_KEY         # paste API key từ AI Studio
firebase functions:secrets:set SEPAY_API_TOKEN        # từ SePay portal
firebase functions:secrets:set SEPAY_WEBHOOK_SECRET   # từ SePay portal (HMAC secret)

# Redeploy để functions pick up secret mới:
firebase deploy --only "functions:aiChat,functions:aiRma,functions:aiCare,functions:sepayTransactions,functions:sepayVirtualAccount,functions:sepaySoundbox,functions:sepayInvoice,functions:sepayWebhook"
```

Verify secret đã active:

```sh
firebase functions:secrets:access GEMINI_API_KEY   # cảnh báo: in plaintext
```

### 3. Enable Firebase Storage

Console: https://console.firebase.google.com/project/vcomm-erp-prod/storage
→ Bấm "Get started" → chọn rules production (mặc định) → region `asia-southeast1`.

Sau đó:

```sh
firebase deploy --only storage
```

(Rules đã có sẵn ở `storage.rules`.)

### 4. Tạo GCS bucket backup + IAM + lifecycle

```sh
# Tạo bucket
gsutil mb -l asia-southeast1 -c standard gs://vcomm-erp-prod-backups

# Grant IAM cho service account Cloud Functions (App Engine default SA)
gcloud projects add-iam-policy-binding vcomm-erp-prod \
  --member="serviceAccount:vcomm-erp-prod@appspot.gserviceaccount.com" \
  --role="roles/datastore.importExportAdmin"

# Cho service account quyền ghi vào bucket
gsutil iam ch \
  serviceAccount:vcomm-erp-prod@appspot.gserviceaccount.com:objectAdmin \
  gs://vcomm-erp-prod-backups

# Set lifecycle 30 ngày (file đã có sẵn ở infra/lifecycle.json)
gsutil lifecycle set infra/lifecycle.json gs://vcomm-erp-prod-backups

# Verify
gsutil lifecycle get gs://vcomm-erp-prod-backups
```

### 5. Setup Sentry (frontend error tracking)

1. Mở https://sentry.io → New Project → React → đặt tên `vcomm-erp`
2. Copy DSN dạng `https://abc@sentry.io/123`
3. Add vào GitHub repo secret `VITE_SENTRY_DSN` (mục 1 trên)
4. Push commit → CI rebuild với DSN → Sentry bắt đầu nhận error từ production

### 6. Bootstrap admin user

User đầu tiên cần đăng ký qua Firebase Console (Authentication → Users → Add user), sau đó:

```sh
GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json \
  npx tsx scripts/set-admin-claim.ts --email <admin-email> --role admin
```

User phải đăng xuất + đăng nhập lại để custom claim có hiệu lực (hoặc client gọi `refreshClaims()`).

### 7. Smoke test sau setup

```sh
curl https://vcomm-erp-prod.web.app/api/health
# Expect: {"status":"ok","service":"vcomm-erp-functions","timestamp":...}

firebase functions:log --since 5m
# Không có error ERROR/FATAL
```

---

## Quick commands

```sh
# Logs Cloud Functions
firebase functions:log                       # all
firebase functions:log --only aiChat         # 1 function
firebase functions:log --since 1h            # last hour

# Firestore rules deploy lại
firebase deploy --only firestore:rules

# Function deploy 1 cái
firebase deploy --only functions:issueInvoice

# Secrets rotate
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:access GEMINI_API_KEY

# Set role cho user
GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json \
  npx tsx scripts/set-admin-claim.ts --email <email> --role admin
```

---

## 1. SePay webhook fail

**Triệu chứng:** `/api/sepay-webhook` trả 401 hoặc 4xx; đơn không tự verify payment.

**Check:**

```sh
firebase functions:log --only sepayWebhook --since 1h
```

**Nguyên nhân & fix:**

- **`Invalid signature`** → `SEPAY_WEBHOOK_SECRET` sai hoặc chưa set.
  ```sh
  firebase functions:secrets:set SEPAY_WEBHOOK_SECRET
  # nhập secret mới giống cấu hình bên SePay portal
  firebase deploy --only functions:sepayWebhook  # redeploy để pick up secret mới
  ```
- **`Invalid JSON`** → SePay gửi sai format. Liên hệ SePay support, gửi requestId từ log.
- **Duplicate event** → bình thường (idempotency). Không phải lỗi.

---

## 2. AI quota hết

**Triệu chứng:** `aiChat`/`aiRma`/`aiCare` trả 502 `AI upstream failed`.

**Check:**

```sh
firebase functions:log --only aiChat --since 30m | grep -i quota
```

**Nguyên nhân & fix:**

- **`429 RESOURCE_EXHAUSTED`** → vượt rate-limit Gemini API.
  - Kiểm tra usage tại https://aistudio.google.com/app/apikey
  - Upgrade tier hoặc rotate key:
    ```sh
    firebase functions:secrets:set GEMINI_API_KEY
    firebase deploy --only functions:aiChat,functions:aiRma,functions:aiCare
    ```
- **`401`** → API key invalid → rotate giống trên.
- **`500` từ Gemini** → tạm thời, retry sau 1-2 phút.

---

## 3. Firestore latency cao / lỗi `unavailable`

**Triệu chứng:** Client thấy "Failed to get document because the client is offline" hàng loạt.

**Check:**

- Status Firebase: https://status.firebase.google.com/
- Cloud Monitoring: filter resource.type="firestore_database"

**Nguyên nhân & fix:**

- **Network của user** → ngoài tầm vận hành, hướng dẫn refresh + check kết nối.
- **Region asia-southeast1 đang gặp sự cố** → đợi status.firebase recovery; thông báo nội bộ
  "Hệ thống tạm gián đoạn".
- **Rule mới block** → kiểm tra deploy cuối:
  ```sh
  firebase firestore:databases:get "(default)" --project vcomm-erp-prod
  # Rollback rules nếu cần:
  git checkout HEAD~1 firestore.rules && firebase deploy --only firestore:rules
  ```

---

## 4. Function cold start chậm (request đầu > 5s)

**Triệu chứng:** Request đầu tiên trong ngày timeout hoặc rất chậm; subsequent OK.

**Nguyên nhân & fix:**

- **Bình thường cho Gen 2 functions ít traffic** — cold start ~2-5s là expected.
- **Giải pháp giảm cold start:**
  - Đặt `minInstances: 1` cho function quan trọng (vd `sepayWebhook`):
    ```ts
    export const sepayWebhook = onRequest(
      { region: REGION, secrets: [...], minInstances: 1, cors: false },
      ...
    );
    ```
  - Phí thêm ~$5-10/tháng cho 1 instance keep warm.
- **Optimize lazy imports** — chỉ import what's needed.

---

## 5. Build CI fail

**Triệu chứng:** GitHub Actions đỏ ở job `build`.

**Check:**

```sh
# Local reproduce
npm ci
npm run lint
npm test
npm run build
```

**Nguyên nhân & fix:**

- **TypeScript error mới** → fix code; check `tsc --noEmit` local.
- **Test fail** → có thể do thay đổi schema hoặc business logic. Update test theo intent đúng.
- **Build OOM** trên CI runner → tăng `--max-old-space-size`:
  ```yaml
  - run: NODE_OPTIONS="--max-old-space-size=4096" npm run build
  ```

---

## Critical contact

| Hệ thống | Liên hệ |
|---|---|
| Firebase / GCP | https://firebase.google.com/support |
| SePay | support@sepay.vn |
| Gemini / AI Studio | https://aistudio.google.com/ |

## Audit trail

Tất cả thay đổi trên các collection nhạy cảm (products, orders, transactions, staff, stores, customers, sepay_events) tự ghi `/audit_logs/{auto}` qua Firestore trigger. Query:

```sh
GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json node -e "
const a=require('firebase-admin'); a.initializeApp({credential:a.credential.applicationDefault()});
a.firestore().collection('audit_logs').orderBy('timestamp','desc').limit(20).get().then(s=>{
  s.forEach(d=>console.log(d.data().collection, d.data().docId, d.data().action, d.data().actorUid));
  process.exit(0);
});
"
```
