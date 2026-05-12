/**
 * Admin auth plugin
 * Hydrates auth state from localStorage on app startup.
 */
export default defineNuxtPlugin(() => {
  const { loadAuth } = useAdminAuth()

  if (import.meta.client) {
    loadAuth()
  }
})
