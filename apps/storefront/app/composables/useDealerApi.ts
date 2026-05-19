/**
 * Dealer API Composable for Storefront
 * Handles dealer dashboard data fetching
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
  const apiBase = `${config.public.apiBase}/api`

  /**
   * Get dealer cari account transactions (history)
   */
  const getCariTransactions = async (): Promise<CariTransaction[]> => {
    try {
      const response = await $fetch<CariTransaction[]>(`${apiBase}/dealer/cari/transactions`)
      return response
    } catch (error) {
      console.error('Error fetching cari transactions:', error)
      throw error
    }
  }

  /**
   * Get dealer's received proformas
   */
  const getProformas = async (): Promise<DealerProforma[]> => {
    try {
      const response = await $fetch<DealerProforma[]>(`${apiBase}/proforma/dealer`)
      return response
    } catch (error) {
      console.error('Error fetching dealer proformas:', error)
      throw error
    }
  }

  /**
   * Download proforma as PDF
   */
  const downloadProforma = async (proformaId: string): Promise<Blob> => {
    try {
      const response = await $fetch(`${apiBase}/proforma/${proformaId}/download`, {
        method: 'GET',
        responseType: 'blob'
      })
      return response as Blob
    } catch (error) {
      console.error('Error downloading proforma:', error)
      throw error
    }
  }

  /**
   * Get dealer profile information
   */
  const getDealerInfo = async (): Promise<DealerInfo> => {
    try {
      const response = await $fetch<DealerInfo>(`${apiBase}/dealer/profile`)
      return response
    } catch (error) {
      console.error('Error fetching dealer info:', error)
      throw error
    }
  }

  /**
   * Download cari statement as Excel
   */
  const downloadCariStatement = async (): Promise<Blob> => {
    try {
      const response = await $fetch(`${apiBase}/dealer/cari/export`, {
        method: 'GET',
        responseType: 'blob'
      })
      return response as Blob
    } catch (error) {
      console.error('Error downloading cari statement:', error)
      throw error
    }
  }

  /**
   * Download stock/price report as Excel
   */
  const downloadStockReport = async (reportType: 'monthly' | 'yearly' | 'invoice' | 'stock'): Promise<Blob> => {
    try {
      const response = await $fetch(`${apiBase}/dealer/reports/${reportType}`, {
        method: 'GET',
        responseType: 'blob'
      })
      return response as Blob
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
    downloadStockReport
  }
}
