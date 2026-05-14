/**
 * Set custom claim role=admin cho 1 user (không phụ thuộc Firestore).
 * Dùng khi Firestore chưa enable hoặc cần gấp.
 *
 * Cách dùng:
 *   npx tsx scripts/set-admin-claim.ts --email admin@vcomm.vn
 *
 * Cần biến môi trường:
 *   GOOGLE_APPLICATION_CREDENTIALS=secrets/service-account.json
 *   (hoặc FIREBASE_SERVICE_ACCOUNT_JSON='{...}')
 */
import admin from 'firebase-admin';
import path from 'path';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.substring(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = 'true';
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const uid = args.uid;
  const role = args.role || 'admin';

  if (!email && !uid) {
    console.error('Phải truyền --email hoặc --uid');
    process.exit(2);
  }

  // Auto-load secrets/service-account.json nếu không set env
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const localPath = path.resolve(process.cwd(), 'secrets', 'service-account.json');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = localPath;
    console.log(`[info] Dùng service account: ${localPath}`);
  }

  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  }

  let targetUid = uid;
  if (!targetUid && email) {
    try {
      const u = await admin.auth().getUserByEmail(email);
      targetUid = u.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.error(`Không tìm thấy user với email ${email}. Hãy tạo user trên Firebase Console trước.`);
        process.exit(3);
      }
      throw err;
    }
  }
  if (!targetUid) throw new Error('Không xác định được UID');

  const currentClaims = (await admin.auth().getUser(targetUid)).customClaims ?? {};
  const newClaims = { ...currentClaims, role };
  await admin.auth().setCustomUserClaims(targetUid, newClaims);

  console.log(`✓ Đã set role=${role} cho uid=${targetUid}${email ? ` (${email})` : ''}`);
  console.log('  → Đăng xuất + đăng nhập lại để claim có hiệu lực.');
}

main().catch((err) => { console.error(err); process.exit(1); });
