import type { Product } from '~/composables/useProducts'
import { useApi } from '~/composables/useApi'

export interface CartItem {
  productId: string
  product: Product
  quantity: number
  addedAt: string
}

export interface Order {
  id: string
  items: CartItem[]
  subtotal: number
  dealerSurcharge: number
  total: number
  status: 'completed' | 'pending-approval'
  isDealer: boolean
  createdAt: string
  notes?: string
  paymentMethod?: string
}

export const useCart = () => {
  const items = useState<CartItem[]>('cart.items', () => [])
  const orders = useState<Order[]>('cart.orders', () => [])

  // Load from localStorage on mount
  const loadCart = () => {
    if (process.client) {
      const stored = localStorage.getItem('cart.items')
      if (stored) {
        try {
          items.value = JSON.parse(stored)
        } catch {
          items.value = []
        }
      }
    }
  }

  // Save to localStorage whenever items change
  const saveCart = () => {
    if (process.client) {
      localStorage.setItem('cart.items', JSON.stringify(items.value))
    }
  }

  // Add item to cart
  const addItem = (product: Product, quantity = 1) => {
    const existing = items.value.find(item => item.productId === product.id)

    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        productId: product.id,
        product,
        quantity,
        addedAt: new Date().toISOString(),
      })
    }

    saveCart()
  }

  // Remove item from cart
  const removeItem = (productId: string) => {
    const idx = items.value.findIndex(item => item.productId === productId)
    if (idx > -1) {
      items.value.splice(idx, 1)
      saveCart()
    }
  }

  // Update quantity
  const updateQuantity = (productId: string, quantity: number) => {
    const item = items.value.find(i => i.productId === productId)
    if (item) {
      if (quantity <= 0) {
        removeItem(productId)
      } else {
        item.quantity = quantity
        saveCart()
      }
    }
  }

  // Clear cart
  const clear = () => {
    items.value = []
    saveCart()
  }

  // Calculate cart totals
  const calculateTotals = (dealerSurchargePerItem?: number) => {
    const subtotal = items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    const dealerSurcharge = dealerSurchargePerItem
      ? items.value.reduce((sum, item) => sum + dealerSurchargePerItem * item.quantity, 0)
      : 0

    return {
      subtotal,
      dealerSurcharge,
      total: subtotal + dealerSurcharge,
      itemCount: items.value.length,
      quantity: items.value.reduce((sum, item) => sum + item.quantity, 0),
    }
  }

  // Place order — sends to API
  const placeOrder = async (isDealer: boolean, dealerSurcharge = 0, paymentMethod = 'bank-transfer') => {
    if (items.value.length === 0) {
      return null
    }

    try {
      const api = useApi()
      const totals = calculateTotals(dealerSurcharge)

      // Prepare order payload
      const orderData = {
        orderLines: items.value.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
        subtotal: totals.subtotal,
        dealerSurcharge: totals.dealerSurcharge,
        total: totals.total,
        paymentMethod,
        notes: '',
      }

      // Send to API
      const response = await api.post<Order>('/orders', orderData)

      // Update orders list and persist
      orders.value.push(response)
      if (process.client) {
        localStorage.setItem('cart.orders', JSON.stringify(orders.value))
      }

      // Clear cart after successful order
      clear()

      return response
    } catch (err) {
      console.error('Order creation failed:', err)
      throw err instanceof Error ? err : new Error('Sipariş oluşturma başarısız oldu')
    }
  }

  // Load orders from localStorage
  const loadOrders = () => {
    if (process.client) {
      const stored = localStorage.getItem('cart.orders')
      if (stored) {
        try {
          orders.value = JSON.parse(stored)
        } catch {
          orders.value = []
        }
      }
    }
  }

  // Get user's orders
  const getUserOrders = () => orders.value

  // Get single order
  const getOrder = (orderId: string) => orders.value.find(o => o.id === orderId)

  return {
    items: readonly(items),
    orders: readonly(orders),
    addItem,
    removeItem,
    updateQuantity,
    clear,
    calculateTotals,
    placeOrder,
    loadCart,
    loadOrders,
    getUserOrders,
    getOrder,
  }
}
