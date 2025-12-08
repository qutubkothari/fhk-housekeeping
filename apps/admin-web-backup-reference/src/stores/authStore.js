import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      orgId: null,
      role: null,
      loading: true,

      initialize: async () => {
        // Check localStorage for user from portal
        const fhkUser = localStorage.getItem('fhk_user')
        if (fhkUser) {
          try {
            const userData = JSON.parse(fhkUser)
            
            // Check if user has admin/supervisor/front_desk role
            const allowedRoles = ['admin', 'supervisor', 'front_desk']
            if (!allowedRoles.includes(userData.role)) {
              // Wrong role, clear storage and stay on login
              localStorage.removeItem('fhk_user')
              set({ user: null, orgId: null, role: null, loading: false })
              return
            }
            
            set({
              user: userData,
              orgId: userData.org_id,
              role: userData.role,
              loading: false,
            })
            return
          } catch (e) {
            console.error('Failed to parse user:', e)
            localStorage.removeItem('fhk_user')
          }
        }
        
        // No user, just set loading to false (stay on login page)
        set({ user: null, orgId: null, role: null, loading: false })
      },

      signIn: async (email, password) => {
        // Simple test user authentication
        const testUsers = {
          'admin@demohotel.com': {
            id: '00000000-0000-0000-0000-000000000002',
            full_name: 'Admin User',
            email: 'admin@demohotel.com',
            role: 'front_desk',
            org_id: '00000000-0000-0000-0000-000000000001'
          },
          'supervisor@demohotel.com': {
            id: '7510deff-26e3-4578-8a41-90cd477222c7',
            full_name: 'Khalid Al-Rashid',
            email: 'supervisor@demohotel.com',
            role: 'supervisor',
            org_id: '00000000-0000-0000-0000-000000000001'
          }
        }

        const userData = testUsers[email.toLowerCase()]
        if (!userData) {
          throw new Error('Invalid email or password')
        }
        
        // Store in localStorage for cross-app access
        localStorage.setItem('fhk_user', JSON.stringify(userData))
        
        set({
          user: userData,
          orgId: userData.org_id,
          role: userData.role,
        })

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.id)

        return userData
      },

      signOut: async () => {
        set({ user: null, orgId: null, role: null })
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('fhk_user')
        window.location.href = '/'
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
