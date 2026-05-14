/**
 * Bootstrap / cấp role cho 1 tài khoản Firebase Auth bằng custom claims.
 *
 * Cách dùng:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
 *   npx tsx scripts/bootstrap-admin.ts --email vinh@vcomm.vn --role admin
 *
 * Hoặc:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{...}' npx tsx scripts/bootstrap-admin.ts --uid <uid> --role manager
 *
 * Role hợp lệ: admin | director | manager | staff
 * Script này KHÔNG tạo user trên Firebase Auth. User phải tự đăng ký 1 lần
 * (qua login email/password hoặc Google) để có UID, sau đó admin chạy script.
 */
import admin from 'firebase-admin';

type Role = 'admin' | 'director' | 'manager' | 'staff';
const VALID_ROLES: Role[] = ['admin', 'director', 'manager', 'staff'];

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.substring(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = 'true';
      }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const uid = args.uid;
  const role = args.role as Role | undefined;
  const storeIdsRaw = args.storeIds;

  if (!email && !uid) {
    console.error('Phải truyền --email hoặc --uid');
    process.exit(2);
  }
  if (!role || !VALID_ROLES.includes(role)) {
    console.error(`--role phải là một trong: ${VALID_ROLES.join(', ')}`);
    process.exit(2);
  }

  // Init Admin SDK
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  }

  // Resolve UID
  let targetUid = uid;
  if (!targetUid && email) {
    const u = await admin.auth().getUserByEmail(email);
    targetUid = u.uid;
  }
  if (!targetUid) {
    console.error('Không thể xác định UID');
    process.exit(2);
  }

  const currentClaims = (await admin.auth().getUser(targetUid)).customClaims ?? {};
  const newClaims: Record<string, any> = { ...currentClaims, role };
  if (storeIdsRaw) {
    newClaims.storeIds = storeIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  await admin.auth().setCustomUserClaims(targetUid, newClaims);

  // Ghi cả /staff/{uid} để có profile + để client query "manager list".
  const db = admin.firestore();
  await db.collection('staff').doc(targetUid).set(
    {
      uid: targetUid,
      email: email ?? null,
      role,
      storeIds: newClaims.storeIds ?? [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`✓ Đã set role=${role} cho uid=${targetUid}${email ? ` (${email})` : ''}`);
  console.log('  User cần đăng xuất + đăng nhập lại (hoặc client gọi refreshClaims()) để claim có hiệu lực.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
