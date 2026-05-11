
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || '';

async function callAIAPI(endpoint: string, body: object): Promise<string> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`AI API responded with ${response.status}`);
    const data = await response.json() as { text?: string };
    return data.text || 'Xin lỗi, vui lòng thử lại sau.';
  } catch (error) {
    console.error('AI API call failed:', error);
    return 'Xin lỗi, hệ thống AI đang bận. Vui lòng liên hệ nhân viên hỗ trợ trực tiếp.';
  }
}

export interface OrderForRMA {
  id: string;
  paymentMethod: string;
}

export interface CustomerForCare {
  name: string;
  totalSpent: number;
  orderCount: number;
  rfmScore?: { recency: number; frequency: number; monetary: number };
}

export async function generateRMAResponse(order: OrderForRMA): Promise<string> {
  return callAIAPI('/api/ai/rma', { order });
}

export async function generateCustomerCareMessage(customer: CustomerForCare): Promise<string> {
  return callAIAPI('/api/ai/customer-care', { customer });
}

export async function getAiChatResponse(
  message: string,
  history: { role: 'user' | 'model'; content: string }[] = []
): Promise<string> {
  return callAIAPI('/api/ai/chat', { message, history });
}
