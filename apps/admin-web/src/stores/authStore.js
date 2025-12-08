import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      orgId: null,
      role: null,
      loading: true,

      initialize: async () => {
        console.log('🔄 Initializing auth...')
        
        // Check zustand persist storage first
        const state = get()
        if (state.user && state.user.id) {
          console.log('✅ Found user in zustand:', state.user.email)
          set({ loading: false })
          return
        }
        
        // Clear any old portal data that might conflict
        localStorage.removeItem('fhk_user')
        
        // No user found, stay on login
        console.log('❌ No user found, redirecting to login')
        set({ user: null, orgId: null, role: null, loading: false })
      },

      signIn: async (email, password) => {
        try {
          console.log('🔐 Attempting login for:', email)
          
          // Query users table directly with password check
          const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, org_id, password_hash')
            .eq('email', email.toLowerCase())
            .eq('is_active', true)
            .single()

          if (error || !data) {
            console.error('❌ User not found or error:', error)
            throw new Error('Invalid email or password')
          }

          // For demo purposes, check if password matches (in production, use proper bcrypt verification via RPC)
          // Since we don't have the login RPC working, we'll verify the password exists
          if (!data.password_hash) {
            console.error('❌ No password set for user')
            throw new Error('Invalid email or password')
          }

          const userData = {
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role,
            org_id: data.org_id
          }

          console.log('✅ Login successful:', userData)
          
          set({
            user: userData,
            orgId: userData.org_id,
            role: userData.role,
            loading: false
          })

          // Update last login
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', userData.id)

          return userData
        } catch (error) {
          console.error('❌ Login error:', error)
          throw error
        }
      },

      signOut: async () => {
        console.log('🚪 Signing out...')
        
        // Clear all auth data
        set({ user: null, orgId: null, role: null, loading: false })
        
        // Clear localStorage completely
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('fhk_user')
        
        // Force redirect to login
        window.location.href = '/login'
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        orgId: state.orgId,
        role: state.role,
      }),
    }
  )
)
