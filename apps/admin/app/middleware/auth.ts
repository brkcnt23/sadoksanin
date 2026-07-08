/**
 * Admin auth middleware
 * Protects routes except login page + enforces role-based access.
 *
 * IMPORTANT: Use `defineNuxtRouteMiddleware` (not `defineRouteMiddleware`).
 * `defineRouteMiddleware` does not exist in Nuxt 3/4 — using it causes:
 *   ReferenceError: defineRouteMiddleware is not defined
 */

// PLASIYER sadece bu sayfalara erisebilir
const PLASIYER_ALLOWED = ['/', '/bayiler', '/proforma', '/raporlar']

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, loadAuth, getUser } = useAdminAuth()

  // Hydrate auth state from localStorage on the client.
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

  // Role-based page protection
  const user = getUser()
  if (user && user.role === 'PLASIYER') {
    // Raporlar alt sayfalari dahil (e.g. /raporlar/plasiyer-sales)
    const allowed = PLASIYER_ALLOWED.some(p => to.path === p || to.path.startsWith(p + '/'))
    if (!allowed) {
      return navigateTo('/')
    }
  }
})
