import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AdminUser } from '@/lib/admin'

interface AdminStore {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: AdminUser | null) => void
  setLoading: (loading: boolean) => void
  login: (user: AdminUser) => void
  logout: () => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)