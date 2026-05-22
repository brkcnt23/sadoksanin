/**
 * Storefront authentication composable.
 *
 * Posts credentials to NestJS `/auth/login` and `/auth/register`, stores the
 * returned JWT under `user-token` (which `useApi` attaches as Bearer header)
 * and persists user payload for UI hydration on page refresh.
 *
 * Hardcoded test creds and demo short-circuits removed; seed users live in
 * the DB now (see apps/api/prisma/seed.ts).
 */

export interface User {
  id: string
  email: string
  name: string
  role: 'CUSTOMER' | 'DEALER' | 'ADMIN' | 'SUPER_ADMIN'
}

interface LoginResponse {
  access_token: string
  user: User
}

interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
  address?: string
  role?: 'CUSTOMER' | 'DEALER'
  company?: string
  contactPerson?: string
  taxNo?: string
  taxOffice?: string
  cariNo?: string
  region?: string
}

const TOKEN_KEY = 'user-token'
const USER_KEY = 'auth.user'

export const useAuth = () => {
  const user = useState<User | null>('auth.user', () => null)
  const isAuthenticated = useState('auth.isAuthenticated', () => false)

  /** Hydrate state from localStorage on client mount. */
  const loadUser = () => {
    if (!import.meta.client) return

    const token = localStorage.getItem(TOKEN_KEY)
    const userJson = localStorage.getItem(USER_KEY)

    if (token && userJson) {
      try {
        user.value = JSON.parse(userJson) as User
        isAuthenticated.value = true
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
  }

  const persist = (token: string, payload: User) => {
    if (!import.meta.client) return
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload))
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const api = useApi()
      const result = await api.post<LoginResponse>('/auth/login', { email, password })
      user.value = result.user
      isAuthenticated.value = true
      persist(result.access_token, result.user)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Giriş başarısız'
      return { success: false, error: message }
    }
  }

  const register = async (
    payload: RegisterPayload,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const api = useApi()
      const result = await api.post<LoginResponse>('/auth/register', payload)
      user.value = result.user
      isAuthenticated.value = true
      persist(result.access_token, result.user)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayıt başarısız'
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
  const getIsAuthenticated = () => isAuthenticated.value

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    login,
    register,
    logout,
    getUser,
    getIsAuthenticated,
    loadUser,
  }
}
