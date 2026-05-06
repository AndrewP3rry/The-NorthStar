import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function createBrowserClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Singleton for reuse across components
let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (_client) return _client;
  _client = createBrowserClient();
  return _client;
}
