/**
 * API client for admin panel
 * Handles authentication, error handling, and requests to NestJS backend
 */

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
}

export const useApi = () => {
  const buildUrl = (path: string, params?: Record<string, string | number | boolean>): string => {
    const config = useRuntimeConfig()
    const base = String(config.public.apiBase).replace(/\/+$/, '')
    const cleanPath = path.startsWith('/') ? path : '/' + path

    // Relative path (e.g. /api) — fetch() resolves against current origin.
    // Absolute URL — new URL('https://.../api' + '/auth/login') works correctly.
    const isAbsolute = base.startsWith('http://') || base.startsWith('https://')
    const fullPath = base + cleanPath
    const url = isAbsolute ? new URL(fullPath) : fullPath

    if (params) {
      const separator = String(url).includes('?') ? '&' : '?'
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value))
      })
      return url + separator + searchParams.toString()
    }
    return url
  }

  const request = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers = {}, params } = options

    const url = buildUrl(path, params)
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    // Add authorization header if token exists
    if (import.meta.client) {
      const token = localStorage.getItem('admin-token')
      if (token) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${token}`,
        }
      }
    }

    // Add body for POST/PATCH/PUT
    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      // Handle 401 — token expired or invalid.
      // Special-case: do NOT redirect when the failing request IS the login
      // call itself; that lets the login form surface the error properly.
      if (response.status === 401) {
        const isLoginRequest = path.includes('/auth/login')

        if (!isLoginRequest && import.meta.client) {
          localStorage.removeItem('admin-token')
          localStorage.removeItem('admin-user')
          if (window.location.pathname !== '/sadoksan-panel') {
            window.location.href = '/sadoksan-panel'
          }
        }

        // Try to surface the backend's message (e.g. "Invalid credentials")
        let backendMessage: string | undefined
        try {
          const body = (await response.clone().json()) as { message?: string }
          if (typeof body?.message === 'string') backendMessage = body.message
        } catch {
          /* response wasn't JSON */
        }
        throw new Error(backendMessage ?? 'Oturum süresi doldu veya geçersiz kimlik bilgileri.')
      }

      // Parse response
      let data: unknown
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Handle error responses
      if (!response.ok) {
        const error = data as Record<string, unknown>
        const message = typeof error?.message === 'string' ? error.message : `API hatası: ${response.status} ${response.statusText}`
        throw new Error(message)
      }

      return data as T
    } catch (err) {
      console.error(`[API] ${method} ${path}:`, err)
      throw err instanceof Error ? err : new Error(String(err))
    }
  }

  return {
    get: <T>(path: string, params?: Record<string, string | number | boolean>) =>
      request<T>(path, { method: 'GET', params }),

    post: <T>(path: string, body?: unknown, params?: Record<string, string | number | boolean>) =>
      request<T>(path, { method: 'POST', body, params }),

    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body }),

    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PUT', body }),

    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE' }),
  }
}
