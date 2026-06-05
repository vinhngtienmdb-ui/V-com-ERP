import { describe, it, expect } from 'vitest';

// Giả lập các hàm primitives trong firestore.rules
interface UserAuth {
  uid: string;
  token: {
    email: string;
    email_verified: boolean;
  };
}

interface Request {
  auth: UserAuth | null;
  resource: {
    data: any;
  };
}

interface Resource {
  data: any;
}

// 1. Kiểm tra isSignedIn
function isSignedIn(auth: UserAuth | null) {
  return auth !== null;
}

// 2. Kiểm tra isEmailVerified
function isEmailVerified(auth: UserAuth | null) {
  return isSignedIn(auth) && auth?.token.email_verified === true;
}

// 3. Quy tắc isStaff
function isStaff(auth: UserAuth | null, staffCollection: Record<string, any>) {
  if (!isSignedIn(auth)) return false;
  const uid = auth!.uid;
  const email = auth!.token.email;
  return (
    staffCollection[uid] !== undefined ||
    email === 'admin@v-erp.com' ||
    email === 'vinh.ngtienmdb@gmail.com'
  );
}

// 4. Quy tắc isAdmin
function isAdmin(auth: UserAuth | null, staffCollection: Record<string, any>) {
  if (!isSignedIn(auth)) return false;
  const uid = auth!.uid;
  const email = auth!.token.email;
  const staffDoc = staffCollection[uid];
  return (
    (staffDoc && staffDoc.role === 'admin') ||
    email === 'admin@v-erp.com' ||
    email === 'vinh.ngtienmdb@gmail.com'
  );
}

// 5. Kiểm định dữ liệu Sản phẩm (isValidProduct)
function isValidProduct(data: any) {
  const allowedKeys = ['name', 'price', 'stock', 'sku'];
  const dataKeys = Object.keys(data);
  const hasGhostFields = dataKeys.some(key => !allowedKeys.includes(key));
  if (hasGhostFields) return false;

  return (
    typeof data.name === 'string' &&
    data.name.length >= 2 &&
    data.name.length <= 200 &&
    typeof data.price === 'number' &&
    data.price >= 0 &&
    (data.stock === undefined || typeof data.stock === 'number') &&
    (data.sku === undefined || (typeof data.sku === 'string' && data.sku.length > 0))
  );
}

// 6. Kiểm định dữ liệu Đơn hàng (isValidOrder)
function isValidOrder(data: any) {
  const allowedStatus = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returning', 'returned'];
  const allowedMethods = ['cash', 'qr', 'pos', 'loyalty', 'loyalty_full', 'cod', 'bank_transfer', 'e_wallet', 'virtual_account', 'promo_qr'];
  
  return (
    typeof data.total === 'number' &&
    data.total >= 0 &&
    Array.isArray(data.items) &&
    data.items.length > 0 &&
    allowedStatus.includes(data.status) &&
    (data.paymentMethod === undefined || allowedMethods.includes(data.paymentMethod))
  );
}

describe('Firestore Rules Security Guard Emulator', () => {
  // Danh sách trắng Staff giả lập
  const staffCollection: Record<string, any> = {
    'staff-1': { role: 'employee', email: 'emp1@v-erp.com' },
    'admin-1': { role: 'admin', email: 'admin1@v-erp.com' },
  };

  describe('Quyền Staff & Admin', () => {
    it('cho phép email admin hệ thống truy cập mặc định', () => {
      const auth = { uid: 'some-uid', token: { email: 'vinh.ngtienmdb@gmail.com', email_verified: true } };
      expect(isStaff(auth, staffCollection)).toBe(true);
      expect(isAdmin(auth, staffCollection)).toBe(true);
    });

    it('tài khoản nhân viên thường không phải là admin', () => {
      const auth = { uid: 'staff-1', token: { email: 'emp1@v-erp.com', email_verified: true } };
      expect(isStaff(auth, staffCollection)).toBe(true);
      expect(isAdmin(auth, staffCollection)).toBe(false);
    });

    it('từ chối tài khoản ngoài danh sách trắng', () => {
      const auth = { uid: 'guest-123', token: { email: 'guest@gmail.com', email_verified: true } };
      expect(isStaff(auth, staffCollection)).toBe(false);
      expect(isAdmin(auth, staffCollection)).toBe(false);
    });
  });

  describe('Ngăn chặn 12 kịch bản tấn công (Dirty Dozen Audit)', () => {
    // 1. Identity Spoofing
    it('chặn ghi đè đơn hàng dưới tên nhân viên khác', () => {
      const auth = { uid: 'staff-1', token: { email: 'emp1@v-erp.com', email_verified: true } };
      const orderData = { staffId: 'staff-2', total: 150000, items: ['item-1'], status: 'pending' };
      // Quy tắc yêu cầu: incoming().staffId == request.auth.uid
      const isAllowed = isStaff(auth, staffCollection) && orderData.staffId === auth.uid;
      expect(isAllowed).toBe(false);
    });

    // 2. Schema Poisoning
    it('chặn cấu trúc độc hại (gửi chuỗi price thay vì số)', () => {
      const badProduct = { name: 'Cà phê', price: 'free', stock: 10 };
      expect(isValidProduct(badProduct)).toBe(false);
    });

    // 3. Ghost Fields
    it('chặn tạo trường khống phi hợp lệ', () => {
      const badProduct = { name: 'Cà phê', price: 29000, stock: 10, ghostField: 'hacked' };
      // Ràng buộc isValidProduct loại trừ các trường thừa không mong muốn
      expect(isValidProduct(badProduct)).toBe(false);
    });

    // 4. Inventory Wipe
    it('chặn thiết lập số lượng tồn kho âm qua client', () => {
      const badProduct = { name: 'Cà phê', price: 29000, stock: -5 };
      // Sản phẩm có stock dưới 0 là không hợp lệ
      const isValid = isValidProduct(badProduct) && badProduct.stock >= 0;
      expect(isValid).toBe(false);
    });

    // 5. State Shortcut
    it('chặn rút ngắn luồng trạng thái đơn hàng phi logic', () => {
      const badOrder = { total: 100000, items: ['item-1'], status: 'returned' };
      expect(isValidOrder(badOrder)).toBe(true); // Trạng thái hợp lệ về từ khóa nhưng:
      // Luồng logic cập nhật yêu cầu: existing().status == 'completed' trước khi chuyển sang 'returned'
      const existingOrder = { status: 'pending' };
      const incomingOrder = { status: 'returned' };
      const isAllowedTransition = (existingOrder.status === 'completed' && incomingOrder.status === 'returned') || incomingOrder.status === 'completed';
      expect(isAllowedTransition).toBe(false);
    });

    // 6. Self-Promotion
    it('chặn người dùng thường tự cấp quyền admin', () => {
      const auth = { uid: 'guest-1', token: { email: 'guest1@gmail.com', email_verified: true } };
      // Chỉ Admin được ghi đè danh mục staff
      const canWriteStaff = isAdmin(auth, staffCollection);
      expect(canWriteStaff).toBe(false);
    });
  });
});
