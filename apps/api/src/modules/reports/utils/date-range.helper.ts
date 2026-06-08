/**
 * Tarih aralığı parser.
 * ?from=2026-01-01&to=2026-06-30 → { start: Date, end: Date }
 * Parametre yoksa son 30 günü döndürür.
 */
export function parseDateRange(from?: string, to?: string): { start: Date; end: Date } {
  const end = to ? new Date(to) : new Date()
  // end'i gün sonuna ayarla
  end.setHours(23, 59, 59, 999)

  const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  // start'i gün başına ayarla
  start.setHours(0, 0, 0, 0)

  return { start, end }
}
