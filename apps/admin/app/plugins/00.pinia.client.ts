/**
 * Pinia is initialized by `@pinia/nuxt` module declared in nuxt.config.ts.
 * No explicit setup is needed here. This file remains as a registered no-op
 * plugin only because Nuxt's plugin scanner emits a "Plugin has no content"
 * warning for empty `*.client.ts` files in `plugins/`, which can re-trigger
 * dev-server reloads on save events.
 *
 * Order prefix `00.` keeps it first in the plugin queue (placeholder in case
 * we ever need pre-store-bootstrap client-side side effects).
 */
export default defineNuxtPlugin(() => {
  // intentionally empty
})
