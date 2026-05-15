export type AttendanceSetting = {
  method: 'gps' | 'wifi' | 'face' | 'qr' | 'device';
  enabled: boolean;
  config: Record<string, any>;
};

export type Candidate = {
  id: string;
  name: string;
  role: string;
  status: 'sourced' | 'interview' | 'offered' | 'hired';
  matchScore: number;
};
