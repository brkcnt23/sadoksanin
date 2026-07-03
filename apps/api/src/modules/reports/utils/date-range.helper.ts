/**
 * Tarih aralığı parser.
 * ?from=2026-01-01&to=2026-06-30 → { start: Date, end: Date }
 * Parametre yoksa TÜM GEÇMİŞİ döndürür (30 gün DEĞİL — sistem yeni, veri
 * hacmi küçük; kısa varsayılan pencere eski siparişleri sessizce rapor
 * toplamlarından düşürüp yanıltıcı olabiliyordu, bkz. 2026-07-03 doğrulama).
 */
export function parseDateRange(from?: string, to?: string): { start: Date; end: Date } {
  const end = to ? new Date(to) : new Date()
  // end'i gün sonuna ayarla
  end.setHours(23, 59, 59, 999)

  const start = from ? new Date(from) : new Date('2000-01-01T00:00:00.000Z')
  // start'i gün başına ayarla
  start.setHours(0, 0, 0, 0)

  return { start, end }
}
