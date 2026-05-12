import { useCart } from '~/composables/useCart'
import type { Product } from '~/composables/useProducts'

export type StockStatus = 'in-stock' | 'low-stock' | 'reserved' | 'out-of-stock'

export const useStock = () => {
  const { orders, loadOrders } = useCart()

  const getPendingOrderCount = (productId: string) => {
    return orders.value.reduce((total, order) => {
      if (order.status === 'pending-approval') {
        const item = order.items.find(i => i.productId === productId)
        return total + (item ? item.quantity : 0)
      }
      return total
    }, 0)
  }

  const getAvailableStock = (product: Product) => {
    const pendingCount = getPendingOrderCount(product.id)
    return Math.max(0, product.stockCount - pendingCount)
  }

  const getStockStatus = (product: Product): StockStatus => {
    const available = getAvailableStock(product)

    if (available === 0) return 'out-of-stock'
    if (available <= 5) return 'low-stock'
    if (getPendingOrderCount(product.id) > 0) return 'reserved'
    return 'in-stock'
  }

  const getStockLabel = (status: StockStatus): string => {
    const labels: Record<StockStatus, string> = {
      'in-stock': 'Stokta',
      'low-stock': 'Az Stok',
      'reserved': 'Sipariş Halinde',
      'out-of-stock': 'Tükendi',
    }
    return labels[status]
  }

  const getStockColor = (status: StockStatus): string => {
    const colors: Record<StockStatus, string> = {
      'in-stock': 'green',
      'low-stock': 'amber',
      'reserved': 'blue',
      'out-of-stock': 'red',
    }
    return colors[status]
  }

  return {
    getPendingOrderCount,
    getAvailableStock,
    getStockStatus,
    getStockLabel,
    getStockColor,
    loadOrders,
  }
}
