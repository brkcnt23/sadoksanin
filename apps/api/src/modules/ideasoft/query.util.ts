/**
 * Ideasoft Admin API liste query parametrelerini normalize eder.
 *
 * Ideasoft semantiği:
 *  - limit: max 100, default 20
 *  - page: 1-tabanlı, default 1
 *  - sort: "id" (artan) / "-id" (azalan). Alan adı sonda "-" ile azalan.
 *  - id / ids: tekil veya virgülle ayrılmış integer listesi
 *  - sinceId: verilen ID'den BÜYÜK kayıtlar
 *  - s: serbest metin arama
 *  - q[field]=value: alan bazlı filtre (q map olarak gelir)
 *
 * Not: Ideasoft ID'lerimiz kayıt oluşturma sırasına göre monoton kabul edilir
 * (go-live'da mevcut kayıtlara createdAt sırasıyla ID backfill edilir). Bu yüzden
 * "sort=id" → createdAt sırası, "sinceId" → ilgili kaydın createdAt'inden sonrası.
 */

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

export interface ListQuery {
  limit: number;
  page: number;
  skip: number;
  sortDir: 'asc' | 'desc';
  sortField: string; // ham alan adı (varsayılan "id")
  ids?: number[]; // id + ids birleşik
  sinceId?: number;
  search?: string; // s
  q: Record<string, string>; // q[field] filtreleri
  raw: Record<string, any>; // ham query (endpoint-özel filtreler için)
}

function toInt(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function parseIds(query: Record<string, any>): number[] | undefined {
  const acc: number[] = [];
  const single = toInt(query.id);
  if (single !== undefined) acc.push(single);
  if (query.ids !== undefined) {
    const list = Array.isArray(query.ids)
      ? query.ids
      : String(query.ids).split(',');
    for (const x of list) {
      const n = toInt(x);
      if (n !== undefined) acc.push(n);
    }
  }
  return acc.length ? [...new Set(acc)] : undefined;
}

export function parseListQuery(query: Record<string, any>): ListQuery {
  const limit = Math.min(
    Math.max(toInt(query.limit) ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const page = Math.max(toInt(query.page) ?? 1, 1);

  const sortRaw = String(query.sort ?? 'id');
  const sortDir: 'asc' | 'desc' = sortRaw.startsWith('-') ? 'desc' : 'asc';
  const sortField = sortRaw.replace(/^-/, '') || 'id';

  // q[field]=value — NestJS bunu query.q = { field: value } olarak parse eder
  const q: Record<string, string> = {};
  if (query.q && typeof query.q === 'object') {
    for (const [k, v] of Object.entries(query.q)) q[k] = String(v);
  }

  return {
    limit,
    page,
    skip: (page - 1) * limit,
    sortDir,
    sortField,
    ids: parseIds(query),
    sinceId: toInt(query.sinceId),
    search: query.s ? String(query.s) : undefined,
    q,
    raw: query,
  };
}

/** ISO 8601 (Ideasoft tarih formatı). null-güvenli. */
export function iso(d: Date | null | undefined): string | null {
  return d ? new Date(d).toISOString() : null;
}
