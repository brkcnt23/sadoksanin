/**
 * Client-only bootstrap. Runs once on app mount.
 * 1. Seeds localStorage if empty (dev mode)
 * 2. Hydrates all Pinia stores — but only if authenticated. Loading stores
 *    on the login page would fire authenticated API calls that get 401'd
 *    and redirect back to /sadoksanadmin, creating a flicker/loop.
 *
 * `.client.ts` suffix = Nuxt skips this on SSR. Filename prefix `01.` makes it
 * run after 00.pinia.client.ts so Pinia is guaranteed ready.
 */
import { seedAdminData } from '~/utils/seed'
import { loadAllStores } from '~/stores'
import { useAdminAuth } from '~/composables/useAdminAuth'

export default defineNuxtPlugin(() => {
  seedAdminData()

  // Hydrate auth from localStorage before deciding whether to load stores
  const { loadAuth, isAuthenticated } = useAdminAuth()
  loadAuth()

  if (isAuthenticated.value) {
    loadAllStores()
  }
})
