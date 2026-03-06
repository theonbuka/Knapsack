import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const SUPABASE_AUTH_REDIRECT_TO = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_TO?.trim();

let cachedAuthClient: SupabaseClient | null = null;

export function getSupabaseAuthClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  if (!cachedAuthClient) {
    cachedAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedAuthClient;
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(getSupabaseAuthClient());
}

export function getSupabaseEmailRedirectUrl(): string {
  if (SUPABASE_AUTH_REDIRECT_TO) {
    return SUPABASE_AUTH_REDIRECT_TO;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/landing`;
  }

  return '';
}
