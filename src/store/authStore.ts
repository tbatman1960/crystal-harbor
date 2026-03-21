import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthUser } from '@/lib/auth'

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (userData: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

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
        // Clear auth state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
        
        // Clear localStorage cart (optional - depends on business logic)
        // For testing: localStorage.removeItem('cart-store')
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }), // only persist user data, not loading states
    }
  )
)