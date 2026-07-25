const value = (name: string): string => process.env[name]?.trim() ?? ''

export const serverConfig = () => ({
  supabaseUrl: value('SUPABASE_URL'),
  supabaseServiceRoleKey: value('SUPABASE_SERVICE_ROLE_KEY'),
  googleAppsScriptUrl: value('GOOGLE_APPS_SCRIPT_URL'),
  googleAppsScriptSecret: value('GOOGLE_APPS_SCRIPT_SECRET'),
  adminEmail: value('ADMIN_EMAIL').toLowerCase(),
  adminPasswordHash: value('ADMIN_PASSWORD_HASH'),
  adminSessionSecret: value('ADMIN_SESSION_SECRET'),
  eventSlug: value('EVENT_SLUG') || value('VITE_EVENT_SLUG') || 'local-demo',
  allowedOrigins: value('PUBLIC_APP_ORIGINS').split(',').map((origin) => origin.trim()).filter(Boolean),
})

export const hasSupabaseConfig = () => {
  const config = serverConfig()
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey)
}

export const hasGoogleSheetsConfig = () => {
  const config = serverConfig()
  return Boolean(config.googleAppsScriptUrl && config.googleAppsScriptSecret)
}
