/**
 * Centralized store access composable
 * Use this instead of importing stores directly to avoid duplication warnings
 */
import { useAuditStore } from '~/stores/audit'
import { useDealersStore } from '~/stores/dealers'
import { useNotificationsStore } from '~/stores/notifications'
import { useOrdersStore } from '~/stores/orders'
import { usePopupsStore } from '~/stores/popups'
import { usePricingStore } from '~/stores/pricing'
import { useProductsStore } from '~/stores/products'
import { useSettingsStore } from '~/stores/settings'
import { useStockStore } from '~/stores/stock'
import { useForexStore } from '~/stores/forex'

export function useStores() {
  return {
    audit: useAuditStore(),
    dealers: useDealersStore(),
    notifications: useNotificationsStore(),
    orders: useOrdersStore(),
    popups: usePopupsStore(),
    pricing: usePricingStore(),
    products: useProductsStore(),
    settings: useSettingsStore(),
    stock: useStockStore(),
    forex: useForexStore(),
  }
}
