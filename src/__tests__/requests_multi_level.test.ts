import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { db, updateDoc, onSnapshot } from '../services/dbService';
import { sendZnsNotification } from '../services/znsService';

// Mock AuthContext
let mockUser: any = { role: 'manager', displayName: 'Manager A' };
let mockIsAdmin = false;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAdmin: mockIsAdmin,
    staffInfo: { role: 'director' } // ensure approval buttons render in all tests
  })
}));

// Mock NotificationContext
vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}));

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

// Mock dbService
let snapshotCallback: any = null;
let currentMockRequests = [
  {
    id: 'REQ-DB-001',
    type: 'finance',
    subtype: 'Tạm ứng',
    title: 'Tạm ứng mua sắm thiết bị',
    requester: 'Trần Văn C',
    status: 'pending',
    amount: 25000000,
    currentLevel: 1,
    workflowSteps: ['Manager', 'Director'],
    createdAt: new Date().toISOString()
  }
];

vi.mock('../services/dbService', async () => {
  const original = await vi.importActual('../services/dbService') as any;
  return {
    ...original,
    db: {},
    collection: vi.fn((_db, name) => name),
    doc: vi.fn((_db, name, id) => ({ tableName: name, id })),
    updateDoc: vi.fn().mockResolvedValue({}),
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    query: vi.fn((coll) => coll),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn((_query, cb) => {
      snapshotCallback = cb;
      // Trigger callback synchronously to avoid race conditions
      cb({
        empty: currentMockRequests.length === 0,
        docs: currentMockRequests.map(req => ({
          id: req.id,
          data: () => req
        }))
      });
      return () => {};
    })
  };
});

// Mock znsService
vi.mock('../services/znsService', () => ({
  sendZnsNotification: vi.fn()
}));

describe('Multi-level Request Approvals & Financial Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  it('should block manager if amount exceeds 20M limit', async () => {
    mockUser = { role: 'manager', displayName: 'Trưởng phòng A' };
    mockIsAdmin = false;
    currentMockRequests = [
      {
        id: 'REQ-DB-001',
        type: 'finance',
        subtype: 'Tạm ứng',
        title: 'Tạm ứng mua sắm thiết bị',
        requester: 'Trần Văn C',
        status: 'pending',
        amount: 25000000, // 25M > 20M
        currentLevel: 1,
        workflowSteps: ['Manager', 'Director'],
        createdAt: new Date().toISOString()
      }
    ];

    const { RequestHub } = await import('../components/RequestHub');
    const { createRoot } = await import('react-dom/client');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(React.createElement(RequestHub));

    // Wait for state updates & rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find the approval button for REQ-DB-001
    const buttons = Array.from(document.querySelectorAll('button'));
    const approveBtn = buttons.find(b => b.textContent?.trim() === 'Duyệt');

    expect(approveBtn).toBeDefined();
    
    // Attempt to approve
    approveBtn?.click();

    // Verify alert message block was triggered
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('vượt quá hạn mức tối đa của Trưởng phòng')
    );

    // Verify updateDoc was NOT called
    expect(updateDoc).not.toHaveBeenCalled();

    // Clean up
    root.unmount();
    document.body.removeChild(container);
  });

  it('should allow Director/Admin to approve requests exceeding 20M limit', async () => {
    mockUser = { role: 'director', displayName: 'Giám đốc B' };
    mockIsAdmin = true;
    currentMockRequests = [
      {
        id: 'REQ-DB-002',
        type: 'finance',
        subtype: 'Tạm ứng',
        title: 'Tạm ứng mua sắm thiết bị',
        requester: 'Trần Văn C',
        status: 'pending',
        amount: 25000000,
        currentLevel: 1,
        workflowSteps: ['Manager', 'Director'],
        createdAt: new Date().toISOString()
      }
    ];

    const { RequestHub } = await import('../components/RequestHub');
    const { createRoot } = await import('react-dom/client');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(React.createElement(RequestHub));

    // Wait for state updates & rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    const buttons = Array.from(document.querySelectorAll('button'));
    const approveBtn = buttons.find(b => b.textContent?.trim() === 'Duyệt');

    expect(approveBtn).toBeDefined();
    
    // Approve should proceed
    approveBtn?.click();

    expect(window.alert).not.toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();

    // Clean up
    root.unmount();
    document.body.removeChild(container);
  });
});
