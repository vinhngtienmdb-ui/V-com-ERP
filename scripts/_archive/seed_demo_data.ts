import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load Firebase Config using process.cwd() for ESM compatibility
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'Thời Trang H&M Vietnam',
    email: 'hm@vietnam.com',
    phone: '0987654321',
    walletBalance: 25000000,
    promoBalance: 3000000,
    totalSpent: 45000000,
    orderCount: 12,
    points: 1250,
    status: 'active',
    segment: 'core',
    rfmScore: { recency: 5, frequency: 5, monetary: 4 },
    activities: [
      { id: 'act_1', type: 'purchase', title: 'Đơn hàng sỉ quần áo nam', description: 'Đã hoàn thành giao dịch sỉ thời trang thu đông trị giá 45M.', date: '2026-05-15', status: 'Hoàn thành' },
      { id: 'act_2', type: 'consultation', title: 'Tư vấn hạn mức tín dụng', description: 'Tư vấn đăng ký hạn mức vay B2B Seller và giải ngân sớm.', date: '2026-05-10', status: 'Hoàn thành' }
    ]
  },
  {
    id: 'CUST-002',
    name: 'Gia Dụng LockLock',
    email: 'locklock@vietnam.com',
    phone: '0912345678',
    walletBalance: 1500000,
    promoBalance: 200000,
    totalSpent: 18000000,
    orderCount: 5,
    points: 180,
    status: 'active',
    segment: 'potential',
    rfmScore: { recency: 4, frequency: 3, monetary: 3 },
    activities: [
      { id: 'act_3', type: 'purchase', title: 'Đơn hàng mua sắm đồ gia dụng', description: 'Đã giao thành công bộ hộp cơm giữ nhiệt.', date: '2026-05-20', status: 'Hoàn thành' }
    ]
  },
  {
    id: 'CUST-003',
    name: 'Mỹ Phẩm Coco Lux',
    email: 'cocolux@vietnam.com',
    phone: '0900112233',
    walletBalance: 12500000,
    promoBalance: 4500000,
    totalSpent: 85000000,
    orderCount: 22,
    points: 3400,
    status: 'active',
    segment: 'core',
    rfmScore: { recency: 5, frequency: 5, monetary: 5 },
    activities: [
      { id: 'act_4', type: 'purchase', title: 'Mua sắm mỹ phẩm sỉ đợt 3', description: 'Hoàn thành đơn hàng son môi và kem chống nắng thương hiệu.', date: '2026-06-01', status: 'Hoàn thành' }
    ]
  }
];

const LEASES = [
  {
    id: 'LEAS-001',
    phone: '0987654321',
    email: 'hm@vietnam.com',
    deviceModel: 'iPhone 15 Pro Max 256GB (Knox MDM)',
    devicePrice: 35000000,
    upfrontFee: 7000000,
    monthlyFee: 2800000,
    durationMonths: 12,
    knoxStatus: 'normal',
    status: 'active',
    installments: [
      { periodNum: 1, amount: 2800000, dueDate: '2026-04-05', status: 'paid' },
      { periodNum: 2, amount: 2800000, dueDate: '2026-05-05', status: 'paid' },
      { periodNum: 3, amount: 2800000, dueDate: '2026-06-05', status: 'unpaid' }
    ]
  },
  {
    id: 'LEAS-002',
    phone: '0912345678',
    email: 'locklock@vietnam.com',
    deviceModel: 'iPad Pro 11-inch M2 (Knox MDM)',
    devicePrice: 24000000,
    upfrontFee: 4800000,
    monthlyFee: 1900000,
    durationMonths: 12,
    knoxStatus: 'warning',
    status: 'late',
    installments: [
      { periodNum: 1, amount: 1900000, dueDate: '2026-04-10', status: 'paid' },
      { periodNum: 2, amount: 1900000, dueDate: '2026-05-10', status: 'overdue' }
    ]
  }
];

const TRANSACTIONS = [
  {
    id: 'TX-HM-01',
    date: '2026-06-01',
    description: 'Thanh toán công nợ Thời Trang H&M Vietnam',
    category: 'Thu tiền khách B2B',
    accountingObjectCode: 'CUST-001',
    debitAccount: '112',
    creditAccount: '131',
    type: 'income',
    amount: 150000000
  },
  {
    id: 'TX-HM-02',
    date: '2026-05-15',
    description: 'Chi giải ngân thanh toán sớm cho Thời Trang H&M Vietnam',
    category: 'Chi trả B2B',
    accountingObjectCode: 'CUST-001',
    debitAccount: '1388',
    creditAccount: '112',
    type: 'expense',
    amount: 120000000
  },
  {
    id: 'TX-LL-01',
    date: '2026-05-25',
    description: 'Thu tiền bán hàng Gia Dụng LockLock',
    category: 'Thu tiền mặt',
    accountingObjectCode: 'CUST-002',
    debitAccount: '111',
    creditAccount: '131',
    type: 'income',
    amount: 18000000
  }
];

async function seed() {
  console.log('Starting demo data seeding...');

  // 1. Seed Customers
  for (const c of CUSTOMERS) {
    await setDoc(doc(db, 'customers', c.id), c);
    console.log(`Seeded Customer: ${c.name} (${c.id})`);
  }

  // 2. Seed Device Leases
  for (const l of LEASES) {
    await setDoc(doc(db, 'device_leases', l.id), l);
    console.log(`Seeded Lease: ${l.deviceModel} (${l.id})`);
  }

  // 3. Seed Transactions
  for (const t of TRANSACTIONS) {
    await setDoc(doc(db, 'finance_transactions', t.id), t);
    console.log(`Seeded Transaction: ${t.description} (${t.id})`);
  }

  console.log('Demo data seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
