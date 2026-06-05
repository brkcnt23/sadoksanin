/**
 * Dealer API Composable for Storefront
 * Handles dealer dashboard data fetching with JWT auth
 */

interface CariTransaction {
  id: string
  date: Date
  type: 'debit' | 'credit'
  amount: number
  description: string
  balance: number
}

interface DealerProforma {
  id: string
  proformaNumber: string
  customerName: string
  customerCity: string
  templateType: string
  generatedAt: Date
  totalAmount: number
  status: 'draft' | 'sent' | 'accepted'
  pdfUrl?: string
}

interface DealerInfo {
  id: string
  name: string
  company: string
  contactPerson: string
  phone: string
  email?: string
  address: string
  city: string
  region: string
  cariBalance: number
  creditLimit: number
  totalOrders: number
  lastOrderAt?: Date
}

export const useDealerApi = () => {
  const config = useRuntimeConfig()
  // config.public.apiBase already ends with /api (e.g. https://sadoksan.smartinnventory.com/api)
  const apiBase = String(config.public.apiBase).replace(/\/+$/, '')

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {}
    if (import.meta.client) {
      const token = localStorage.getItem('user-token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  const getCariTransactions = async (): Promise<CariTransaction[]> => {
    try {
      return await $fetch<CariTransaction[]>(`${apiBase}/dealer/cari/transactions`, {
        headers: getAuthHeaders(),
      })
    } catch (error) {
      console.error('Error fetching cari transactions:', error)
      throw error
    }
  }

  const getProformas = async (): Promise<DealerProforma[]> => {
    try {
      return await $fetch<DealerProforma[]>(`${apiBase}/proforma/dealer`, {
        headers: getAuthHeaders(),
      })
    } catch (error) {
      console.error('Error fetching dealer proformas:', error)
      throw error
    }
  }

  const downloadBlob = async (url: string): Promise<Blob> => {
    const headers = getAuthHeaders()
    const response = await fetch(url, { headers })
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)
    return await response.blob()
  }

  const downloadProforma = async (proformaId: string): Promise<Blob> => {
    try {
      return await downloadBlob(`${apiBase}/proforma/${proformaId}/download`)
    } catch (error) {
      console.error('Error downloading proforma:', error)
      throw error
    }
  }

  const getDealerInfo = async (): Promise<DealerInfo> => {
    try {
      return await $fetch<DealerInfo>(`${apiBase}/dealer/profile`, {
        headers: getAuthHeaders(),
      })
    } catch (error) {
      console.error('Error fetching dealer info:', error)
      throw error
    }
  }

  const downloadCariStatement = async (): Promise<Blob> => {
    try {
      return await downloadBlob(`${apiBase}/dealer/cari/export`)
    } catch (error) {
      console.error('Error downloading cari statement:', error)
      throw error
    }
  }

  const downloadStockReport = async (reportType: 'monthly' | 'yearly' | 'invoice' | 'stock' | 'detailed' | 'risk' | 'aging' | 'performance'): Promise<Blob> => {
    try {
      return await downloadBlob(`${apiBase}/dealer/reports/${reportType}`)
    } catch (error) {
      console.error('Error downloading report:', error)
      throw error
    }
  }

  return {
    getCariTransactions,
    getProformas,
    downloadProforma,
    getDealerInfo,
    downloadCariStatement,
    downloadStockReport,
  }
}
