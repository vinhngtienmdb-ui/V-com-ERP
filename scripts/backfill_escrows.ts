/**
 * Backfill escrow cho đơn cũ: đã paid/delivered nhưng chưa có escrow (Luật 36/2024).
 * Chạy 1 lần sau khi deploy migration 012: npx tsx scripts/backfill_escrows.ts
 */
import 'dotenv/config';

async function main() {
  const { Client } = await import('pg');
  const pg = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  console.log('=== Backfill escrows cho đơn đã thanh toán ===\n');

  // Đơn đã paid trở đi, có seller, CHƯA có escrow
  const { rows: orders } = await pg.query(
    `SELECT o.id, o.seller_id, o.customer_id, o.total, o.status, o.created_at,
            o.delivered_at, o.tenant_id
     FROM public.orders o
     WHERE o.status IN ('paid','confirmed','allocated','picking','packed','shipped','delivered','completed')
       AND o.seller_id IS NOT NULL
       AND o.total > 0
       AND NOT EXISTS (SELECT 1 FROM public.escrows e WHERE e.order_id = o.id)`
  );
  console.log(`Tìm thấy ${orders.length} đơn cần backfill escrow.`);

  let created = 0, delivered = 0, completedSkip = 0;
  for (const o of orders) {
    const retentionDays = 7;
    const lockedAt = new Date(o.created_at);
    const autoRelease = new Date(lockedAt.getTime() + retentionDays * 86400000);
    const isPast = ['delivered', 'completed'].includes(o.status);

    // Đơn đã completed → escrow không còn ý nghĩa giữ tiền (tiền đã đối soát/chi);
    // đánh dấu released-ngay để không phát sinh giải ngân kép từ cron.
    const initStatus = o.status === 'completed' ? 'released' : (isPast ? 'delivered' : 'locked');
    if (o.status === 'completed') completedSkip++;

    const { rowCount } = await pg.query(
      `INSERT INTO public.escrows
         (tenant_id, order_id, amount, seller_id, buyer_id, status,
          locked_at, delivered_at, retention_days, auto_release_at, released_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (order_id) DO NOTHING`,
      [
        o.tenant_id || 'tenant-vcomm-prod-01',
        o.id,
        Number(o.total),
        o.seller_id,
        o.customer_id || 'guest',
        initStatus,
        lockedAt.toISOString(),
        isPast ? (o.delivered_at || lockedAt.toISOString()) : null,
        retentionDays,
        autoRelease.toISOString(),
        o.status === 'completed' ? new Date().toISOString() : null
      ]
    );
    if (rowCount) {
      created++;
      if (initStatus === 'delivered') delivered++;
    }
  }

  console.log(`\nĐã tạo: ${created} escrow`);
  console.log(`  - locked (chờ giao): ${created - delivered - completedSkip}`);
  console.log(`  - delivered (đang đếm retention): ${delivered}`);
  console.log(`  - released (đơn completed cũ): ${completedSkip}`);
  await pg.end();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
