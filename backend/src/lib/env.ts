const optional = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
};

export const env = {
  supabaseUrl: optional('NEXT_PUBLIC_SUPABASE_URL') ?? optional('SUPABASE_URL') ?? 'http://127.0.0.1:54321',
  supabaseServiceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY') ?? optional('SUPABASE_SECRET_KEY') ?? 'build-time-placeholder-key',
  databaseUrl: optional('DATABASE_URL'),
  supabaseDbPassword: optional('SUPABASE_DB_PASSWORD'),
  supabaseDbHost: optional('SUPABASE_DB_HOST') ?? 'aws-0-us-east-1.pooler.supabase.com',
  supabaseDbPort: Number(optional('SUPABASE_DB_PORT') ?? '6543'),
  supabaseDbName: optional('SUPABASE_DB_NAME') ?? 'postgres',
  supabaseDbUser: optional('SUPABASE_DB_USER') ?? 'postgres.drkmtnvhgsytcgepjfui',
  sessionSecret: optional('SESSION_SECRET') ?? 'development-only-change-me',
};
