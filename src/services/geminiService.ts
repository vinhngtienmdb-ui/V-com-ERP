import { auth } from '../lib/firebase';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function postAI(path: string, body: any) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
  };
  const res = await fetch(`${API_BASE}/api/ai/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI API ${path} failed (${res.status}): ${errText}`);
  }
  return res.json();
}

export async function generateRMAResponse(order: any): Promise<string> {
  try {
    const { text } = await postAI('rma', { order });
    return text;
  } catch (err) {
    console.error('generateRMAResponse error:', err);
    return 'Xin lỗi, hệ thống AI đang bận. Vui lòng liên hệ nhân viên hỗ trợ trực tiếp.';
  }
}

export async function generateCustomerCareMessage(customer: any): Promise<string> {
  try {
    const { text } = await postAI('care', { customer });
    return text;
  } catch (err) {
    console.error('generateCustomerCareMessage error:', err);
    return 'Xin lỗi, hệ thống AI đang bận. Vui lòng liên hệ nhân viên hỗ trợ trực tiếp.';
  }
}

export async function getAiChatResponse(
  message: string,
  history: { role: 'user' | 'model'; content: string }[] = [],
): Promise<string> {
  try {
    const { text } = await postAI('chat', { message, history });
    return text;
  } catch (err) {
    console.error('getAiChatResponse error:', err);
    return 'Xin lỗi, hệ thống AI đang bận. Vui lòng liên hệ nhân viên hỗ trợ trực tiếp.';
  }
}
