import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase: SupabaseClient =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : ({} as SupabaseClient);
