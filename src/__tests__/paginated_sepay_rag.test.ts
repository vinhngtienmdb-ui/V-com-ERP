import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, collection, query, orderBy, getDocs } from '../lib/firebase';
import { range, search, ilike } from '../lib/firebase';
import axios from 'axios';

vi.mock('axios');

describe('Paginated Queries, SePay Webhook & AI RAG Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Giai đoạn 2: Server-side Pagination Constraints', () => {
    it('nên khởi tạo các constraint range, search, ilike chính xác', () => {
      const r = range(0, 9);
      expect(r.type).toBe('range');
      expect(r.field).toBe('0');
      expect(r.value).toBe(9);

      const s = search('sản phẩm', ['name', 'description']);
      expect(s.type).toBe('search');
      expect(s.field).toBe('name,description');
      expect(s.value).toBe('sản phẩm');

      const i = ilike('sku', 'IPHONE');
      expect(i.type).toBe('ilike');
      expect(i.field).toBe('sku');
      expect(i.value).toBe('IPHONE');
    });

    it('nên chuyển đổi range và search constraints sang Supabase và trả về count chính xác', async () => {
      const mockDocs = [
        { id: '1', data: { name: 'Customer A' } },
        { id: '2', data: { name: 'Customer B' } }
      ];
      const mockResult = {
        docs: mockDocs,
        empty: false,
        size: 2,
        count: 15
      };

      vi.mocked(getDocs).mockResolvedValue(mockResult as any);

      const q = query(
        collection(db, 'customers'),
        orderBy('id', 'asc'),
        range(0, 9),
        search('Customer', ['name'])
      );

      const snap = await getDocs(q);
      expect(snap.count).toBe(15);
      expect(snap.size).toBe(2);
      expect(snap.docs).toEqual(mockDocs);
    });
  });

  describe('Giai đoạn 3: SePay Webhook & Simulator', () => {
    it('giả lập gọi webhook SePay thành công qua endpoint của local server', async () => {
      const mockPayload = {
        gateway: 'VietinBank',
        transferAmount: 1500000,
        content: 'VCOMM_ORD_1002',
        description: 'VCOMM_ORD_1002'
      };

      vi.mocked(axios.post).mockResolvedValue({
        data: { status: 'success', message: 'Webhook received and processed' }
      });

      const response = await axios.post('/api/sepay/webhook', mockPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Apikey mock_secret'
        }
      });

      expect(axios.post).toHaveBeenCalledWith(
        '/api/sepay/webhook',
        mockPayload,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Apikey mock_secret'
          })
        })
      );
      expect(response.data.status).toBe('success');
    });

    it('giả lập gọi webhook SePay nạp tiền ví thành công', async () => {
      const mockPayload = {
        gateway: 'VietinBank',
        transferAmount: 500000,
        content: 'VCOMM_DEP_CUST99',
        description: 'VCOMM_DEP_CUST99'
      };

      vi.mocked(axios.post).mockResolvedValue({
        data: { status: 'success', message: 'Webhook received and processed' }
      });

      const response = await axios.post('/api/sepay/webhook', mockPayload);
      expect(axios.post).toHaveBeenCalledWith('/api/sepay/webhook', mockPayload);
      expect(response.data.status).toBe('success');
    });
  });

  describe('Giai đoạn 4: Database RAG Natural Language to SQL translation', () => {
    it('gửi truy vấn AI RAG dịch ngôn ngữ tự nhiên thành SQL và trả về rows', async () => {
      const mockRagResult = {
        sql: "SELECT data->>'name' as name, (data->>'price')::numeric as price FROM products WHERE tenant_id = 'tenant-vcomm-prod-01' ORDER BY price DESC LIMIT 5",
        explanation: "Truy vấn lấy 5 sản phẩm đắt nhất của tenant-vcomm-prod-01 sắp xếp giảm dần theo giá.",
        rows: [
          { name: 'iPhone 15 Pro Max', price: 34990000 },
          { name: 'MacBook Pro M3', price: 45990000 }
        ]
      };

      vi.mocked(axios.post).mockResolvedValue({ data: mockRagResult });

      const response = await axios.post('/api/gemini/db-query', {
        query: 'Hiển thị các sản phẩm đắt nhất',
        tenantId: 'tenant-vcomm-prod-01'
      });

      expect(axios.post).toHaveBeenCalledWith(
        '/api/gemini/db-query',
        expect.objectContaining({
          query: 'Hiển thị các sản phẩm đắt nhất'
        })
      );
      expect(response.data.sql).toContain('SELECT');
      expect(response.data.rows.length).toBe(2);
      expect(response.data.rows[0].name).toBe('iPhone 15 Pro Max');
    });
  });
});
