/**
 * Admin authentication composable.
 *
 * Posts credentials to NestJS `/auth/login`, stores the returned JWT in
 * localStorage under `admin-token`, and persists user payload for UI.
 * `useApi` reads `admin-token` and attaches it as `Authorization: Bearer`.
 *
 * Hardcoded credentials and demo-mode short-circuits have been removed —
 * the admin@admin.com seed user lives in the DB now (see prisma/seed.ts).
 */

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SUPER_ADMIN' | 'DEALER'
}

interface LoginResponse {
  access_token: string
  user: AdminUser
}

const TOKEN_KEY = 'admin-token'
const USER_KEY = 'admin-user'

export const useAdminAuth = () => {
  const user = useState<AdminUser | null>('admin-user', () => null)
  const isAuthenticated = useState('admin-auth', () => false)

  /** Hydrate state from localStorage on client mount. SSR no-op. */
  const loadAuth = () => {
    if (!import.meta.client) return

    const token = localStorage.getItem(TOKEN_KEY)
    const userJson = localStorage.getItem(USER_KEY)

    if (token && userJson) {
      try {
        user.value = JSON.parse(userJson) as AdminUser
        isAuthenticated.value = true
      } catch {
        // Corrupt localStorage — clear and stay logged out
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const api = useApi()
      const result = await api.post<LoginResponse>('/auth/login', { email, password })

      // Reject non-admin roles at the gate. The admin panel must not accept
      // DEALER tokens even if the credentials are valid backend-side.
      if (result.user.role !== 'ADMIN' && result.user.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Bu hesabın admin paneline erişim yetkisi yok.' }
      }

      user.value = result.user
      isAuthenticated.value = true

      if (import.meta.client) {
        localStorage.setItem(TOKEN_KEY, result.access_token)
        localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      }

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Giriş başarısız'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  const getUser = () => user.value

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    loadAuth,
    login,
    logout,
    getUser,
  }
}
