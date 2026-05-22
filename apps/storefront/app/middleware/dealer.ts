/**
 * Dealer-only middleware — protects routes that only DEALER users can access.
 * Usage: definePageMeta({ middleware: 'dealer' })
 */
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return

  const token = localStorage.getItem('auth-token')
  if (!token) {
    return navigateTo('/giris')
  }

  try {
    const user = JSON.parse(localStorage.getItem('auth-user') ?? '{}')
    if (user.role !== 'DEALER') {
      return navigateTo('/')
    }
  } catch {
    return navigateTo('/giris')
  }
})
