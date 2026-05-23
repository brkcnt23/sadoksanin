import type { Product } from '~/composables/useProducts'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

export interface CartItem {
  id?: string
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

const STORAGE_KEY = 'cart.items'

export const useCart = () => {
  const items = useState<CartItem[]>('cart.items', () => [])
  const orders = useState<Order[]>('cart.orders', () => [])

  const { isAuthenticated } = useAuth()
  let merged = false

  // Auto-merge local cart when user logs in
  if (import.meta.client) {
    watch(isAuthenticated, async (authed) => {
      if (authed && !merged) {
        merged = true
        await mergeLocalToServer()
        items.value = await fetchServerCart()
      }
      if (!authed) merged = false
    })
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  const loadLocalCart = (): CartItem[] => {
    if (process.client) {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      } catch { return [] }
    }
    return []
  }

  const saveLocalCart = (cart: CartItem[]) => {
    if (process.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    }
  }

  const fetchServerCart = async (): Promise<CartItem[]> => {
    try {
      const api = useApi()
      const serverItems = await api.get<any[]>('/cart')
      return serverItems.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        product: i.product,
        quantity: i.quantity,
        addedAt: i.addedAt,
      }))
    } catch { return [] }
  }

  // ─── Init / Load ─────────────────────────────────────────────────────

  const loadCart = async () => {
    if (isAuthenticated.value) {
      items.value = await fetchServerCart()
    } else {
      items.value = loadLocalCart()
    }
  }

  // ─── Merge local → server on login ────────────────────────────────────

  const mergeLocalToServer = async () => {
    const local = loadLocalCart()
    if (local.length === 0) return
    try {
      const api = useApi()
      await api.post('/cart/merge', {
        items: local.map(i => ({ productId: i.productId, quantity: i.quantity })),
      })
      saveLocalCart([])
    } catch { /* keep local if merge fails */ }
  }

  // ─── Operations ──────────────────────────────────────────────────────

  const addItem = async (product: Product, quantity = 1) => {
    if (isAuthenticated.value) {
      try {
        const api = useApi()
        await api.post('/cart/add', { productId: product.id, quantity })
        items.value = await fetchServerCart()
        return
      } catch { /* fallthrough to local */ }
    }

    // Local fallback
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        productId: product.id, product, quantity,
        addedAt: new Date().toISOString(),
      })
    }
    saveLocalCart(items.value)
  }

  const removeItem = async (productId: string) => {
    if (isAuthenticated.value) {
      try {
        const api = useApi()
        await api.delete(`/cart/${productId}`)
        items.value = await fetchServerCart()
        return
      } catch { /* fallthrough */ }
    }

    const idx = items.value.findIndex(i => i.productId === productId)
    if (idx > -1) { items.value.splice(idx, 1); saveLocalCart(items.value) }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId)

    if (isAuthenticated.value) {
      try {
        const api = useApi()
        await api.patch(`/cart/${productId}`, { quantity })
        items.value = await fetchServerCart()
        return
      } catch { /* fallthrough */ }
    }

    const item = items.value.find(i => i.productId === productId)
    if (item) { item.quantity = quantity; saveLocalCart(items.value) }
  }

  const clear = async () => {
    if (isAuthenticated.value) {
      try {
        const api = useApi()
        await api.delete('/cart')
      } catch { /* ignore */ }
    }
    items.value = []
    saveLocalCart([])
  }

  // ─── Totals ──────────────────────────────────────────────────────────

  const calculateTotals = (dealerSurchargePerItem?: number) => {
    const subtotal = items.value.reduce((sum, i) => sum + i.product.basePrice * i.quantity, 0)
    const dealerSurcharge = dealerSurchargePerItem
      ? items.value.reduce((sum, i) => sum + dealerSurchargePerItem * i.quantity, 0) : 0
    return {
      subtotal,
      dealerSurcharge,
      total: subtotal + dealerSurcharge,
      itemCount: items.value.length,
      quantity: items.value.reduce((sum, i) => sum + i.quantity, 0),
    }
  }

  // ─── Place Order ─────────────────────────────────────────────────────

  const placeOrder = async (payload: {
    customerType: 'B2C' | 'B2B'
    shippingCity: string
    shippingAddress: string
    dealerId?: string
    promoCode?: string
    notes?: string
    paymentMethod?: string
  }) => {
    if (items.value.length === 0) return null

    try {
      const api = useApi()
      const orderData = {
        items: items.value.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.product.basePrice,
          taxRate: 0.2,
        })),
        customerType: payload.customerType,
        shippingCity: payload.shippingCity,
        shippingAddress: payload.shippingAddress,
        dealerId: payload.dealerId,
        promoCode: payload.promoCode,
        notes: payload.notes,
        paymentMethod: payload.paymentMethod,
      }

      const response = await api.post<Order>('/orders', orderData)
      orders.value.push(response)
      await clear()
      return response
    } catch (err) {
      console.error('Order creation failed:', err)
      throw err instanceof Error ? err : new Error('Sipariş oluşturma başarısız oldu')
    }
  }

  // ─── Orders (from API if authenticated) ──────────────────────────────

  const getUserOrders = async () => {
    if (isAuthenticated.value) {
      try {
        const api = useApi()
        const { orders: apiOrders } = await api.get<{ orders: Order[] }>('/orders')
        return apiOrders
      } catch { /* fallback */ }
    }
    return orders.value
  }

  const getOrder = (orderId: string) => orders.value.find(o => o.id === orderId)

  return {
    items: readonly(items),
    orders: readonly(orders),
    addItem, removeItem, updateQuantity, clear,
    calculateTotals, placeOrder,
    loadCart, mergeLocalToServer,
    getUserOrders, getOrder,
  }
}
