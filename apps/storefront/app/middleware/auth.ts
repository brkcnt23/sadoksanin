/**
 * Auth middleware — protects routes that require authentication.
 * Usage: definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return

  const token = localStorage.getItem('auth-token')
  if (!token) {
    return navigateTo('/giris')
  }
})
