import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper function to get current user's organization
export const getCurrentUserOrg = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role, full_name, preferred_language')
    .eq('id', user.id)
    .single()

  return userData
}

// Helper function to handle API errors
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}
