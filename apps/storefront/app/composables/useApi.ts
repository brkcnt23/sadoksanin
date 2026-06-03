/**
 * API client for storefront
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
    // new URL('/path', 'https://host/api') strips /api — join manually
    const base = String(config.public.apiBase).replace(/\/+$/, '')
    const cleanPath = path.startsWith('/') ? path : '/' + path
    const url = new URL(base + cleanPath)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }
    return url.toString()
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

    // Add authorization header if token exists (for B2B dealers)
    if (import.meta.client) {
      const token = localStorage.getItem('user-token')
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

      // Handle 401 — token expired or invalid
      if (response.status === 401) {
        // Clear token and redirect to login
        if (import.meta.client) {
          localStorage.removeItem('user-token')
          window.location.href = '/giris'
        }
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
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
        const errorBody = (data ?? {}) as Record<string, unknown>
        const message =
          typeof errorBody.message === 'string'
            ? errorBody.message
            : `API hatası: ${response.status} ${response.statusText}`
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
