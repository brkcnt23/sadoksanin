/**
 * Plasiyer-only middleware — protects /plasiyer/* routes.
 * Only PLASIYER role users can access.
 * Usage: definePageMeta({ middleware: 'plasiyer' })
 */
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return

  const token = localStorage.getItem('user-token')
  if (!token) {
    return navigateTo('/giris')
  }

  try {
    const user = JSON.parse(localStorage.getItem('auth.user') ?? '{}')
    if (user.role !== 'PLASIYER') {
      return navigateTo('/')
    }
  } catch {
    return navigateTo('/giris')
  }
})
