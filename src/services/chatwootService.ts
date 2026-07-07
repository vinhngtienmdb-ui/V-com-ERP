/**
 * Chatwoot API Service
 * 
 * Manages connections and data fetching from Chatwoot Headless API.
 * 
 * IMPORTANT: To use this in production, set the following environment variables:
 * VITE_CHATWOOT_BASE_URL (e.g., https://app.chatwoot.com)
 * VITE_CHATWOOT_ACCESS_TOKEN (Your agent or bot access token)
 * VITE_CHATWOOT_ACCOUNT_ID (Your account ID, usually 1)
 */

const BASE_URL = import.meta.env.VITE_CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
const ACCESS_TOKEN = import.meta.env.VITE_CHATWOOT_ACCESS_TOKEN || '';
const ACCOUNT_ID = import.meta.env.VITE_CHATWOOT_ACCOUNT_ID || '1';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'api_access_token': ACCESS_TOKEN
});

export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  messages: any[];
  meta: {
    sender: {
      id: number;
      name: string;
      avatar_url: string;
      phone_number: string;
      email: string;
    };
    channel: string;
  };
  status: string;
  unread_count: number;
  updated_at: number;
}

export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: number; // 0: incoming, 1: outgoing, 2: activity
  content_type: string;
  sender_type: string; // 'Contact', 'User'
  sender: {
    id: number;
    name: string;
    avatar_url: string;
  };
  created_at: number;
}

const MOCK_CONVERSATIONS: ChatwootConversation[] = [
  {
    id: 1, inbox_id: 1, status: 'open', unread_count: 2, updated_at: Math.floor(Date.now() / 1000) - 120,
    messages: [{ id: 101, content: 'Chào shop, bộ nồi vân đá còn hàng không?', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 1, name: 'Nguyễn Văn A', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 120 }],
    meta: { sender: { id: 1, name: 'Nguyễn Văn A', avatar_url: 'https://i.pravatar.cc/150?u=1', phone_number: '0901234567', email: 'a@example.com' }, channel: 'facebook' }
  },
  {
    id: 2, inbox_id: 2, status: 'open', unread_count: 0, updated_at: Math.floor(Date.now() / 1000) - 600,
    messages: [{ id: 102, content: 'Bên mình có chi nhánh ở Hà Nội không ạ?', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 2, name: 'Trần Thị B', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 600 }],
    meta: { sender: { id: 2, name: 'Trần Thị B', avatar_url: 'https://i.pravatar.cc/150?u=2', phone_number: '', email: '' }, channel: 'zalo' }
  },
  {
    id: 3, inbox_id: 3, status: 'open', unread_count: 5, updated_at: Math.floor(Date.now() / 1000) - 3600,
    messages: [{ id: 103, content: 'Tôi muốn bảo hành sản phẩm', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 3, name: 'Lê C', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 3600 }],
    meta: { sender: { id: 3, name: 'Lê C (Zalo Cá nhân)', avatar_url: 'https://i.pravatar.cc/150?u=3', phone_number: '0988888888', email: '' }, channel: 'zalo_personal' }
  },
  {
    id: 4, inbox_id: 4, status: 'resolved', unread_count: 0, updated_at: Math.floor(Date.now() / 1000) - 86400,
    messages: [{ id: 104, content: 'Đã nhận được hàng, rất đẹp!', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 4, name: 'Phạm D', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 86400 }],
    meta: { sender: { id: 4, name: 'Phạm D', avatar_url: 'https://i.pravatar.cc/150?u=4', phone_number: '', email: '' }, channel: 'tiktok' }
  },
  {
    id: 5, inbox_id: 5, status: 'open', unread_count: 1, updated_at: Math.floor(Date.now() / 1000) - 300,
    messages: [{ id: 105, content: 'Check tin nhắn ib em với admin', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 5, name: 'Hotgirl E', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 300 }],
    meta: { sender: { id: 5, name: 'Hotgirl E', avatar_url: 'https://i.pravatar.cc/150?u=5', phone_number: '', email: '' }, channel: 'instagram' }
  },
  {
    id: 6, inbox_id: 6, status: 'open', unread_count: 0, updated_at: Math.floor(Date.now() / 1000) - 1500,
    messages: [{ id: 106, content: 'Cho hỏi về chính sách đại lý', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 6, name: 'Mr. John', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 1500 }],
    meta: { sender: { id: 6, name: 'Mr. John', avatar_url: 'https://i.pravatar.cc/150?u=6', phone_number: '', email: '' }, channel: 'telegram' }
  },
  {
    id: 7, inbox_id: 7, status: 'open', unread_count: 1, updated_at: Math.floor(Date.now() / 1000) - 4000,
    messages: [{ id: 107, content: 'Hello, do you ship to China?', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 7, name: 'Wang Wei', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 4000 }],
    meta: { sender: { id: 7, name: 'Wang Wei', avatar_url: 'https://i.pravatar.cc/150?u=7', phone_number: '', email: '' }, channel: 'wechat' }
  },
  {
    id: 8, inbox_id: 8, status: 'open', unread_count: 0, updated_at: Math.floor(Date.now() / 1000) - 50,
    messages: [{ id: 108, content: 'Sản phẩm dạo này trend quá', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 8, name: 'Tóp Tóp', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 50 }],
    meta: { sender: { id: 8, name: 'Tóp Tóp', avatar_url: 'https://i.pravatar.cc/150?u=8', phone_number: '', email: '' }, channel: 'threads' }
  },
  {
    id: 9, inbox_id: 9, status: 'open', unread_count: 1, updated_at: Math.floor(Date.now() / 1000) - 10,
    messages: [{ id: 109, content: 'Tôi đang xem trang web của bạn', message_type: 0, content_type: 'text', sender_type: 'Contact', sender: { id: 9, name: 'Khách truy cập #8412', avatar_url: '' }, created_at: Math.floor(Date.now() / 1000) - 10 }],
    meta: { sender: { id: 9, name: 'Khách truy cập #8412', avatar_url: '', phone_number: '', email: '' }, channel: 'web' }
  }
];

const getActiveChannels = () => {
  const saved = localStorage.getItem('vcomm_active_channels');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return ['web', 'facebook'];
    }
  }
  return ['web', 'facebook'];
};

/**
 * Fetch all conversations for the account
 */
export const getConversations = async (status: string = 'open'): Promise<ChatwootConversation[]> => {
  // Mock delay
  await new Promise(r => setTimeout(r, 600));
  
  const activeChannels = getActiveChannels();
  
  // Lọc ra các hội thoại thuộc các kênh đang bật
  let filtered = MOCK_CONVERSATIONS.filter(c => activeChannels.includes(c.meta.channel));
  
  // Lọc theo status
  if (status !== 'all') {
    filtered = filtered.filter(c => c.status === status);
  }
  
  // Sắp xếp mới nhất lên đầu
  filtered.sort((a, b) => b.updated_at - a.updated_at);
  
  return filtered;
};

/**
 * Fetch messages for a specific conversation
 */
export const getMessages = async (conversationId: number): Promise<ChatwootMessage[]> => {
  await new Promise(r => setTimeout(r, 300));
  const convo = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
  return convo ? convo.messages : [];
};

/**
 * Send a new message in a conversation
 */
export const sendMessage = async (conversationId: number, content: string, isPrivate: boolean = false): Promise<ChatwootMessage | null> => {
  await new Promise(r => setTimeout(r, 400));
  const convo = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
  if (convo) {
    const newMsg: ChatwootMessage = {
      id: Date.now(),
      content,
      message_type: 1, // outgoing
      content_type: 'text',
      sender_type: 'User',
      sender: {
        id: 99,
        name: 'Agent',
        avatar_url: ''
      },
      created_at: Math.floor(Date.now() / 1000)
    };
    convo.messages.push(newMsg);
    convo.updated_at = Math.floor(Date.now() / 1000);
    return newMsg;
  }
  return null;
};

/**
 * Resolve (close) a conversation
 */
export const resolveConversation = async (conversationId: number): Promise<boolean> => {
  await new Promise(r => setTimeout(r, 400));
  const convo = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
  if (convo) {
    convo.status = 'resolved';
    return true;
  }
  return false;
};
