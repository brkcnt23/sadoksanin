/**
 * Storage adapter — single seam between UI and persistence.
 *
 * Today: localStorage (admin SPA, no SSR concerns).
 * Tomorrow: replace `read`/`write` bodies with `$fetch` to NestJS — UI untouched.
 */

const NS = 'sadoksan-admin:'

export const storage = {
  read<T>(key: string, fallback: T): T {
    if (import.meta.server) return fallback
    try {
      const raw = localStorage.getItem(NS + key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },

  write<T>(key: string, value: T): void {
    if (import.meta.server) return
    localStorage.setItem(NS + key, JSON.stringify(value))
  },

  remove(key: string): void {
    if (import.meta.server) return
    localStorage.removeItem(NS + key)
  },

  clear(): void {
    if (import.meta.server) return
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k))
  },
}

/**
 * Generates a stable but readable ID. Replace with backend UUIDs when wired up.
 */
export const uid = (prefix = 'id'): string =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

/**
 * Normalize price formatting across all admin views.
 */
export const formatPrice = (n: number): string =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(n)

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('tr-TR').format(n)

export const formatDate = (d: string | Date, opts: Intl.DateTimeFormatOptions = {}): string =>
  new Date(d).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  })

export const formatRelative = (d: string | Date): string => {
  const now = Date.now()
  const t = new Date(d).getTime()
  const diffMs = now - t
  const min = 60_000
  const hr = 60 * min
  const day = 24 * hr
  if (diffMs < min) return 'şimdi'
  if (diffMs < hr) return `${Math.floor(diffMs / min)} dk önce`
  if (diffMs < day) return `${Math.floor(diffMs / hr)} saat önce`
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} gün önce`
  return formatDate(d, { hour: undefined, minute: undefined })
}
