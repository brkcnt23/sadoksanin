/**
 * Boot helper — hydrate every store from storage in one call.
 * Called by plugins/01.bootstrap.client.ts on first app render.
 *
 * NOTE: Pinia stores are auto-imported by Nuxt from this directory.
 * We deliberately do NOT re-export `useXxxStore` here — re-exports cause
 * Nuxt's auto-import scanner to register the same identifier twice
 * (once from the source file, once from the barrel) and emit
 * "Duplicated imports" warnings. Import individual stores directly via
 * auto-import or from `~/stores/<name>` if explicit.
 */
import { useAuditStore } from './audit'
import { useDealersStore } from './dealers'
import { useNotificationsStore } from './notifications'
import { useOrdersStore } from './orders'
import { usePopupsStore } from './popups'
import { usePricingStore } from './pricing'
import { useProductsStore } from './products'
import { useSettingsStore } from './settings'
import { useStockStore } from './stock'

export function loadAllStores() {
  useProductsStore().load()
  useOrdersStore().load()
  useDealersStore().load()
  useStockStore().load()
  usePricingStore().load()
  usePopupsStore().load()
  useNotificationsStore().load()
  useSettingsStore().load()
  useAuditStore().load()
}
