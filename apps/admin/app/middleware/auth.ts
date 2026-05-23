/**
 * Admin auth middleware
 * Protects routes except login page.
 *
 * IMPORTANT: Use `defineNuxtRouteMiddleware` (not `defineRouteMiddleware`).
 * `defineRouteMiddleware` does not exist in Nuxt 3/4 — using it causes:
 *   ReferenceError: defineRouteMiddleware is not defined
 */
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, loadAuth } = useAdminAuth()

  // Hydrate auth state from localStorage on the client.
  // SSR is disabled for admin (SPA), but guard anyway.
  if (import.meta.client) {
    loadAuth()
  }

  // Login route is always reachable; redirect away if already logged in.
  if (to.path === '/sadoksan-panel') {
    if (isAuthenticated.value) {
      return navigateTo('/')
    }
    return
  }

  // Everything else requires auth.
  if (!isAuthenticated.value) {
    return navigateTo('/sadoksan-panel')
  }
})
