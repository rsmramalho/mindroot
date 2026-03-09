// types/share.ts — Public sharing types
// Zero imports. Pure types.

export type ShareContentType = 'reflection' | 'streak';

export interface PublicShare {
  id: string;
  token: string;
  content_type: ShareContentType;
  content_id: string;
  content_data: Record<string, unknown> | null;
  owner_id: string;
  created_at: string;
  expires_at: string | null;
}

export interface SharedReflectionData {
  title: string;
  description: string | null;
  emotion_before: string | null;
  emotion_after: string | null;
  module: string | null;
  created_at: string;
  include_date: boolean;
  include_module: boolean;
}

export interface SharedStreakData {
  current: number;
  longest: number;
  last_active_date: string | null;
  generated_at: string;
}
