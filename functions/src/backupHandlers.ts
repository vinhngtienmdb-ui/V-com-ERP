import { onSchedule } from 'firebase-functions/v2/scheduler';
import { REGION } from './config.js';

/**
 * Daily Firestore backup — export tất cả collection sang GCS bucket
 * `vcomm-erp-prod-backups`. Chạy 2h sáng VN mỗi ngày.
 *
 * Yêu cầu trước khi function chạy:
 *  1. Tạo GCS bucket `vcomm-erp-prod-backups` trong cùng region (asia-southeast1).
 *     gsutil mb -l asia-southeast1 gs://vcomm-erp-prod-backups
 *  2. Gán quyền Cloud Datastore Import Export Admin cho service account
 *     của Cloud Functions:
 *     gcloud projects add-iam-policy-binding vcomm-erp-prod \
 *       --member="serviceAccount:vcomm-erp-prod@appspot.gserviceaccount.com" \
 *       --role="roles/datastore.importExportAdmin"
 *  3. Set lifecycle policy 30 ngày trên bucket:
 *     gsutil lifecycle set lifecycle.json gs://vcomm-erp-prod-backups
 *
 * Backup sẽ tạo prefix theo ngày: gs://vcomm-erp-prod-backups/YYYY-MM-DD/
 */
export const dailyBackup = onSchedule(
  { region: REGION, schedule: '0 2 * * *', timeZone: 'Asia/Ho_Chi_Minh' },
  async () => {
    const project = process.env.GCLOUD_PROJECT;
    if (!project) {
      console.error('[dailyBackup] GCLOUD_PROJECT chưa set');
      return;
    }
    const bucket = `gs://${project}-backups`;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const outputUri = `${bucket}/${date}`;

    // Dùng Firestore Admin REST API qua firebase-admin's google-auth.
    // Đơn giản hơn @google-cloud/firestore admin client.
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/datastore'],
    });
    const client = await auth.getClient();
    const firestore = google.firestore({ version: 'v1', auth: client as any });

    try {
      const res = await firestore.projects.databases.exportDocuments({
        name: `projects/${project}/databases/(default)`,
        requestBody: { outputUriPrefix: outputUri },
      });
      console.log(`[dailyBackup] started export to ${outputUri}`, res.data);
    } catch (err: any) {
      console.error('[dailyBackup] failed:', err.message ?? err);
      throw err;
    }
  },
);
