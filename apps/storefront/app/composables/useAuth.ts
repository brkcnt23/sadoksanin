export interface User {
  id: string
  email: string
  ad: string
  soyad: string
  telefon: string
  sehir: string
  adres: string
  createdAt: string
}

export const useAuth = () => {
  const user = useState<User | null>('auth.user', () => null)
  const isAuthenticated = useState('auth.isAuthenticated', () => false)

  // Load from localStorage on mount
  const loadUser = () => {
    if (process.client) {
      const stored = localStorage.getItem('auth.user')
      if (stored) {
        user.value = JSON.parse(stored)
        isAuthenticated.value = true
      }
    }
  }

  const login = async (email: string, password: string) => {
    // Simple test user
    if (email === 'test@test.com' && password === 'asd123') {
      const loggedInUser: User = {
        id: 'user-1',
        email: 'test@test.com',
        ad: 'Ahmet',
        soyad: 'Yılmaz',
        telefon: '0539 654 17 20',
        sehir: 'İstanbul',
        adres: 'Test Caddesi No: 5',
        createdAt: '2024-06-15',
      }
      user.value = loggedInUser
      isAuthenticated.value = true
      localStorage.setItem('auth.user', JSON.stringify(loggedInUser))
      return { success: true }
    }
    return { success: false, error: 'Geçersiz email veya şifre' }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('auth.user')
  }

  const getUser = () => user.value
  const getIsAuthenticated = () => isAuthenticated.value

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    login,
    logout,
    getUser,
    getIsAuthenticated,
    loadUser,
  }
}
