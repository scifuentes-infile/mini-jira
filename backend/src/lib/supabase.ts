import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { env } from '@/lib/env';

declare global {
  var __miniJiraSupabase: SupabaseClient | undefined;
  var __miniJiraPgPool: Pool | undefined;
}

export const supabase = globalThis.__miniJiraSupabase ?? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

if (process.env.NODE_ENV !== 'production') globalThis.__miniJiraSupabase = supabase;

const connectionString = env.databaseUrl ?? (env.supabaseDbPassword ? 'postgresql://' + encodeURIComponent(env.supabaseDbUser) + ':' + encodeURIComponent(env.supabaseDbPassword) + '@' + env.supabaseDbHost + ':' + env.supabaseDbPort + '/' + env.supabaseDbName + '?sslmode=require&uselibpqcompat=true' : undefined);

export const pool = globalThis.__miniJiraPgPool ?? new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV !== 'production') globalThis.__miniJiraPgPool = pool;
