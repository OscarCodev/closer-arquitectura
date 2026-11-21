/** Configuración pública del frontend (variables NEXT_PUBLIC_*, ver .env.example). */
export const appConfig = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, ''),
  authMode: (process.env.NEXT_PUBLIC_AUTH_MODE === 'supabase' ? 'supabase' : 'dev') as 'supabase' | 'dev',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  voiceMode: (process.env.NEXT_PUBLIC_VOICE_MODE === 'gemini' ? 'gemini' : 'mock') as 'gemini' | 'mock',
}
