// service/share-service.ts — Public sharing CRUD
// Manages public_shares table for reflection & streak sharing

import { supabase } from './supabase';
import type { PublicShare, ShareContentType } from '@/types/share';

export const shareService = {
  /**
   * Generate a share token. Idempotent — returns existing token if already shared.
   */
  async generateShareToken(
    contentId: string,
    contentType: ShareContentType,
    contentData: Record<string, unknown>,
    ownerId: string
  ): Promise<string> {
    // Check for existing share
    const { data: existing } = await supabase
      .from('public_shares')
      .select('token')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existing) return existing.token;

    const { data, error } = await supabase
      .from('public_shares')
      .insert({
        content_id: contentId,
        content_type: contentType,
        content_data: contentData,
        owner_id: ownerId,
      })
      .select('token')
      .single();

    if (error) throw error;
    return data.token;
  },

  /**
   * Fetch shared content by token. No auth required.
   * Returns null if not found or expired.
   */
  async getSharedContent(token: string): Promise<PublicShare | null> {
    const { data, error } = await supabase
      .from('public_shares')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data as PublicShare;
  },

  /**
   * Revoke (delete) a share by token.
   */
  async revokeShare(token: string): Promise<void> {
    const { error } = await supabase
      .from('public_shares')
      .delete()
      .eq('token', token);

    if (error) throw error;
  },

  /**
   * Check if content already has a share link.
   */
  async getExistingShare(
    contentId: string,
    contentType: ShareContentType,
    ownerId: string
  ): Promise<string | null> {
    const { data } = await supabase
      .from('public_shares')
      .select('token')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .eq('owner_id', ownerId)
      .maybeSingle();

    return data?.token ?? null;
  },
};
