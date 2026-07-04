import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, auth, googleProvider } from '../services/dbService';
import { WorkflowTask } from '../types/erp';

// In-memory cache for Google Access Token and linked email
let cachedAccessToken: string | null = null;
let cachedEmail: string | null = null;

// Clear on-memory cache when user signs out from Firebase Auth
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedEmail = null;
  }
});

/**
 * Interface representing the result of Google Calendar link
 */
export interface GoogleCalendarSession {
  email: string | null;
  accessToken: string;
}

/**
 * Link Google Calendar by prompting a Popup authentication with Firebase Auth
 */
export const linkGoogleCalendar = async (): Promise<GoogleCalendarSession> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    if (!token) {
      throw new Error('Không thể lấy Access Token từ Google Authentication');
    }

    cachedAccessToken = token;
    cachedEmail = result.user.email;
    
    return {
      email: cachedEmail,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Lỗi liên kết Google Calendar:', error);
    throw error;
  }
};

/**
 * Access the active cached Google Access Token
 */
export const getGoogleCalendarSession = (): GoogleCalendarSession | null => {
  if (!cachedAccessToken) return null;
  return {
    email: cachedEmail,
    accessToken: cachedAccessToken,
  };
};

/**
 * Disconnect/Clear Google Calendar session in memory
 */
export const disconnectGoogleCalendar = () => {
  cachedAccessToken = null;
  cachedEmail = null;
};

/**
 * Parses Vietnamese relative deadline strings to valid ISO Start & End dates
 */
export const parseDeadlineStringToDate = (deadline: string): { start: string; end: string } => {
  const now = new Date();
  let targetDate = new Date(now.getTime() + 60 * 60 * 1000); // Default: +1 hour

  const clean = deadline.toLowerCase().trim();
  if (clean.includes('ngay lập tức') || clean.includes('lập tức')) {
    targetDate = new Date(now.getTime() + 15 * 60 * 1000); // +15 mins
  } else if (clean.includes('2 giờ tới') || clean.includes('2 giờ')) {
    targetDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours
  } else if (clean.includes('hôm nay')) {
    // Schedule event starting 30 mins before 18:00
    targetDate.setHours(18, 0, 0, 0);
    // If today is past 18:00, schedule +2 hours from now
    if (targetDate.getTime() < now.getTime()) {
      targetDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }
  } else if (clean.includes('ngày mai')) {
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(17, 0, 0, 0); // Tomorrow at 17:00
  } else {
    // Other format default to 24 hours from now
    targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  // Duration: 45 minutes
  const startDate = new Date(targetDate.getTime() - 45 * 60 * 1000);
  return {
    start: startDate.toISOString(),
    end: targetDate.toISOString(),
  };
};

/**
 * Create a task deadline event inside Google Calendar
 */
export const createCalendarEvent = async (
  task: WorkflowTask,
  start: string,
  end: string
): Promise<any> => {
  const session = getGoogleCalendarSession();
  if (!session) {
    throw new Error('Vui lòng kết nối Google Calendar trước khi đồng bộ.');
  }

  const payload = {
    summary: `[VComm ERP] Deadline: ${task.title}`,
    description: `Nhiệm vụ cần xử lý gấp:\n\n- Mã nhiệm vụ: ${task.id}\n- Phân hệ quản lý: ${task.module}\n- Độ ưu tiên: ${task.priority.toUpperCase()}\n- Hạn chót ban đầu: ${task.deadline}\n\nVui lòng đăng nhập hệ thống VComm ERP để thực hiện xử lý hoặc điều phối.`,
    start: {
      dateTime: start,
      timeZone: 'Asia/Ho_Chi_Minh',
    },
    end: {
      dateTime: end,
      timeZone: 'Asia/Ho_Chi_Minh',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error('Lỗi Google Calendar API:', errorBody);
    throw new Error(errorBody.error?.message || 'Không thể tạo sự kiện lịch trên Google Calendar');
  }

  return response.json();
};
