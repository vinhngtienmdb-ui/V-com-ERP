import { describe, it, expect } from 'vitest';

// 1. Mailbox Filter / Search helper test
interface EmailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  isRead: boolean;
  folder: string;
}

function searchAndFilterEmails(
  emails: EmailItem[],
  folder: string,
  searchQuery: string,
  filterUnread: boolean
): EmailItem[] {
  return emails.filter(m => {
    // Folder filter
    if (m.folder !== folder) return false;

    // Search query match
    const matchesSearch = 
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.senderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Read/Unread filter
    const matchesUnread = filterUnread ? !m.isRead : true;

    return matchesSearch && matchesUnread;
  });
}

// 2. Chat Group Validation helper test
interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'department';
  desc?: string;
}

function validateNewGroup(name: string, desc: string, memberIds: string[]): { isValid: boolean; error: string | null } {
  if (!name.trim()) {
    return { isValid: false, error: 'Tên nhóm không được để trống.' };
  }
  if (name.length > 50) {
    return { isValid: false, error: 'Tên nhóm không được vượt quá 50 ký tự.' };
  }
  if (memberIds.length === 0) {
    return { isValid: false, error: 'Nhóm chat phải có ít nhất 1 thành viên.' };
  }
  return { isValid: true, error: null };
}

describe('eOffice Mailbox and Chat features logic tests', () => {
  const mockEmails: EmailItem[] = [
    { id: '1', senderName: 'Lê Hoàng Minh', senderEmail: 'minh.lh@vcomm.vn', subject: 'Biên bản đối soát T22', body: 'Biên bản đối soát doanh thu siêu thị VComm', isRead: false, folder: 'inbox' },
    { id: '2', senderName: 'Microsoft 365', senderEmail: 'no-reply@microsoft.com', subject: 'Kích hoạt Office 365', body: 'Tài khoản Office 365 đã sẵn sàng', isRead: true, folder: 'inbox' },
    { id: '3', senderName: 'Bạn (Vinh NT)', senderEmail: 'vinhnt@vcomm.vn', subject: 'Báo cáo tiến độ', body: 'Đã hoàn thành phân hệ Settings Enterprise', isRead: true, folder: 'sent' },
  ];

  describe('Mail Client search and filters', () => {
    it('should filter by folder correctly', () => {
      const inboxList = searchAndFilterEmails(mockEmails, 'inbox', '', false);
      expect(inboxList.length).toBe(2);

      const sentList = searchAndFilterEmails(mockEmails, 'sent', '', false);
      expect(sentList.length).toBe(1);
    });

    it('should search emails by sender name, subject or body', () => {
      // Search by subject
      const searchSub = searchAndFilterEmails(mockEmails, 'inbox', 'đối soát', false);
      expect(searchSub.length).toBe(1);
      expect(searchSub[0].id).toBe('1');

      // Search by sender name
      const searchSender = searchAndFilterEmails(mockEmails, 'inbox', 'Microsoft', false);
      expect(searchSender.length).toBe(1);
      expect(searchSender[0].id).toBe('2');

      // Search with no results
      const searchNone = searchAndFilterEmails(mockEmails, 'inbox', 'không tồn tại', false);
      expect(searchNone.length).toBe(0);
    });

    it('should filter unread emails correctly', () => {
      const unreadInbox = searchAndFilterEmails(mockEmails, 'inbox', '', true);
      expect(unreadInbox.length).toBe(1);
      expect(unreadInbox[0].id).toBe('1');
    });
  });

  describe('Internal Chat group creation validation', () => {
    it('should fail validation if group name is empty', () => {
      const result = validateNewGroup('  ', 'Mô tả nhóm', ['user-1']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Tên nhóm không được để trống.');
    });

    it('should fail validation if group name is too long', () => {
      const longName = 'A'.repeat(51);
      const result = validateNewGroup(longName, 'Mô tả nhóm', ['user-1']);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Tên nhóm không được vượt quá 50 ký tự.');
    });

    it('should fail validation if no members are invited', () => {
      const result = validateNewGroup('Nhóm Tester', 'Mô tả nhóm', []);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Nhóm chat phải có ít nhất 1 thành viên.');
    });

    it('should pass validation with valid name and members', () => {
      const result = validateNewGroup('Nhóm Dự Án eOffice', 'Mô tả nhóm', ['user-1', 'user-2']);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });
});
