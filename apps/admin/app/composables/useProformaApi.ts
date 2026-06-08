/**
 * Proforma API Composable for Admin Panel
 * All requests attach the admin JWT (admin-token in localStorage) and
 * surface 401s consistently. Add new endpoints via `apiFetch` so auth
 * stays uniform.
 */

interface ProformaItem {
  sku: string
  description: string
  quantity: number
  price: number
  /** Image source: data:image/... URI (manual upload), https URL, or null */
  imageUrl?: string | null
}

interface ProductImageLookup {
  sku: string
  name: string
  brand: string
  imageUrl: string | null
}

interface ProformaCreatePayload {
  templateType: 'LOCAL' | 'INTERNATIONAL'
  customer: string
  items: ProformaItem[]
}

interface Proforma {
  id: string
  proformaNumber: string
  customer: string
  city: string
  template: string
  date: Date
  amount: number
  status: 'draft' | 'sent' | 'accepted'
}

export interface ProductSearchResult {
  id: string
  sku: string
  name: string
  brand: string
  category: string
  basePrice: number
  imageUrl: string | null
}

export const useProformaApi = () => {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase).replace(/\/+$/, '')

  /** Build Authorization header from the admin token localStorage. */
  const authHeaders = (): Record<string, string> => {
    if (import.meta.client) {
      const token = localStorage.getItem('admin-token')
      if (token) return { Authorization: `Bearer ${token}` }
    }
    return {}
  }

  /** Build full URL — handles both relative (/api) and absolute (https://) bases. */
  const buildUrl = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path : '/' + path
    const isAbsolute = apiBase.startsWith('http://') || apiBase.startsWith('https://')
    if (isAbsolute) return new URL(apiBase + cleanPath).toString()
    return apiBase + cleanPath
  }

  /** Thin wrapper around fetch that always sends JWT and handles errors like useApi. */
  const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const url = buildUrl(path)
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers as Record<string, string> ?? {}),
      },
      // JSON.stringify body if it's an object (fetch requires string body)
      ...(options.body && typeof options.body === 'object' ? { body: JSON.stringify(options.body) } : {}),
    })

    if (!res.ok) {
      let msg = `API hatası: ${res.status}`
      try {
        const body = await res.clone().json()
        if (typeof body?.message === 'string') msg = body.message
      } catch { /* response wasn't JSON */ }
      throw new Error(msg)
    }

    // Handle blob responses (PDF download)
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
      return (await res.blob()) as unknown as T
    }

    return (await res.json()) as T
  }

  /**
   * Create a new proforma (save as draft)
   */
  const createProforma = async (payload: ProformaCreatePayload): Promise<Proforma> => {
    return apiFetch<Proforma>('/proforma/create', { method: 'POST', body: payload })
  }

  /**
   * Create a draft then immediately mark it as sent.
   * Two-step because /generate expects detailed customer/company DTOs while
   * the admin quick-create form only collects a customer name.
   */
  const createAndSendProforma = async (payload: ProformaCreatePayload): Promise<Proforma> => {
    const draft = await apiFetch<Proforma>('/proforma/create', {
      method: 'POST',
      body: payload,
    })
    if (draft?.id) {
      await apiFetch(`/proforma/${draft.id}/send`, { method: 'PATCH' })
    }
    return draft
  }

  /**
   * Fetch all proformas with optional filtering
   */
  const getProformas = async (filters?: {
    status?: 'draft' | 'sent' | 'accepted'
    search?: string
  }): Promise<Proforma[]> => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)

    const path = params.toString()
      ? `/proforma/history?${params.toString()}`
      : '/proforma/history'
    const data = await apiFetch<any>(path)
    return Array.isArray(data) ? data : []
  }

  /** Mark a proforma as sent */
  const sendProforma = async (proformaId: string): Promise<void> => {
    await apiFetch(`/proforma/${proformaId}/send`, { method: 'PATCH' })
  }

  /** Download proforma as PDF blob */
  const downloadProforma = async (proformaId: string): Promise<Blob> => {
    return apiFetch<Blob>(`/proforma/${proformaId}/download`, { method: 'GET' })
  }

  /** Delete a proforma */
  const deleteProforma = async (proformaId: string): Promise<void> => {
    await apiFetch(`/proforma/${proformaId}`, { method: 'DELETE' })
  }

  /** Get single proforma details */
  const getProforma = async (proformaId: string): Promise<Proforma> => {
    return apiFetch<Proforma>(`/proforma/${proformaId}`)
  }

  /**
   * Look up product image (and metadata) by SKU. Returns null when the
   * product is not found or the lookup fails — callers should treat it as
   * "no auto-fill available" rather than an error state.
   */
  const getProductImage = async (sku: string): Promise<ProductImageLookup | null> => {
    const trimmed = sku?.trim()
    if (!trimmed) return null

    try {
      return await apiFetch<ProductImageLookup>(
        `/proforma/product-image/${encodeURIComponent(trimmed)}`,
      )
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.status === 404) return null
      console.warn('Product image lookup failed:', error)
      return null
    }
  }

  /**
   * Search products for the proforma autocomplete.
   * Returns up to `limit` matches by SKU, name, or brand (case-insensitive).
   */
  const searchProducts = async (
    query: string,
    limit = 10,
  ): Promise<ProductSearchResult[]> => {
    const q = query?.trim()
    if (!q) return []

    try {
      return await apiFetch<ProductSearchResult[]>(
        `/proforma/products/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      )
    } catch (error: any) {
      console.warn('Product search failed:', error)
      return []
    }
  }

  /**
   * List all active dealers (for customer dropdown)
   */
  const getDealers = async (): Promise<{ id: string; name: string; company: string; city: string; phone: string; cariNo: string }[]> => {
    try {
      return await apiFetch('/dealer/list')
    } catch (error: any) {
      console.warn('Failed to fetch dealers:', error)
      return []
    }
  }

  return {
    createProforma,
    createAndSendProforma,
    getProformas,
    sendProforma,
    downloadProforma,
    deleteProforma,
    getProforma,
    getProductImage,
    searchProducts,
    getDealers,
  }
}
