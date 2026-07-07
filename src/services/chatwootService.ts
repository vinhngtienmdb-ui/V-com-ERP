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

/**
 * Fetch all conversations for the account
 */
export const getConversations = async (status: string = 'open'): Promise<ChatwootConversation[]> => {
  if (!ACCESS_TOKEN) return [];
  try {
    const response = await fetch(`${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=${status}`, {
      headers: getHeaders()
    });
    const data = await response.json();
    return data.data.payload || [];
  } catch (error) {
    console.error('Chatwoot getConversations error:', error);
    return [];
  }
};

/**
 * Fetch messages for a specific conversation
 */
export const getMessages = async (conversationId: number): Promise<ChatwootMessage[]> => {
  if (!ACCESS_TOKEN) return [];
  try {
    const response = await fetch(`${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
      headers: getHeaders()
    });
    const data = await response.json();
    return data.payload || [];
  } catch (error) {
    console.error('Chatwoot getMessages error:', error);
    return [];
  }
};

/**
 * Send a new message in a conversation
 */
export const sendMessage = async (conversationId: number, content: string, isPrivate: boolean = false): Promise<ChatwootMessage | null> => {
  if (!ACCESS_TOKEN) return null;
  try {
    const response = await fetch(`${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        content,
        private: isPrivate
      })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Chatwoot sendMessage error:', error);
    return null;
  }
};

/**
 * Resolve (close) a conversation
 */
export const resolveConversation = async (conversationId: number): Promise<boolean> => {
  if (!ACCESS_TOKEN) return false;
  try {
    const response = await fetch(`${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/toggle_status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status: 'resolved' })
    });
    return response.ok;
  } catch (error) {
    console.error('Chatwoot resolveConversation error:', error);
    return false;
  }
};
