// // import { createClient, SupabaseClient } from "@supabase/supabase-js";

// // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// // const supabaseKey =
// //   process.env.SUPABASE_SERVICE_ROLE_KEY ||
// //   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// // export const supabase: SupabaseClient =
// //   supabaseUrl && supabaseKey
// //     ? createClient(supabaseUrl, supabaseKey)
// //     : ({} as SupabaseClient); // Bypass build environment checks

// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qvxgqbjymxdjulnijkvw.supabase.co";
// const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ALz4ZbLvvUrAnhnOAosCsg_hVpy-pZg";

// export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qvxgqbjymxdjulnijkvw.supabase.co";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_ALz4ZbLvvUrAnhnOAosCsg_hVpy-pZg";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
