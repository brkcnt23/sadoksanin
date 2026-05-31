export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (path === '/' || path.startsWith('/api/') || path.startsWith('/_nuxt/') || path.startsWith('/__')) return

  try {
    const config = useRuntimeConfig()
    const res = await $fetch<{ newUrl: string } | null>(`/cms/redirects/check?url=${encodeURIComponent(path)}`, {
      baseURL: config.public.apiBase,
      headers: { 'accept': 'application/json' },
    }).catch(() => null)
    if (res?.newUrl) {
      sendRedirect(event, res.newUrl, 301)
    }
  } catch { /* redirect check fails silently */ }
})
