/**
 * Excel export/import utilities for pricing data
 */
import type { RegionalPricingSurcharge, ProvincePricingSurcharge } from '~/types'

/* ────────────────────────────────────────────────────────────────────────
 * TEK MERKEZİ EXCEL ÜRETİCİSİ
 * Tüm admin panelindeki "Excel'e aktar" butonları buradan geçer.
 * Gerçek .xlsx üretir (SheetJS) — her değer kendi hücresinde, Türkçe Excel'de
 * tek sütuna sıkışma sorunu YOK. Para/yüzde/sayı sütunları gerçek sayı olarak
 * yazılır (Excel'de toplanabilir), uygun sayı formatıyla.
 * ──────────────────────────────────────────────────────────────────────── */

export type ExcelCellType = 'text' | 'int' | 'number' | 'money' | 'pct'

export interface ExcelColumn {
  /** Sütun başlığı (1. satır) */
  header: string
  /** Satır objesindeki alan adı */
  key: string
  /** Hücre tipi — sayı formatını belirler (varsayılan: text) */
  type?: ExcelCellType
  /** Sabit sütun genişliği (karakter). Verilmezse içeriğe göre otomatik. */
  width?: number
}

export interface ExcelSheet {
  /** Sayfa (sekme) adı — Excel 31 karakterle sınırlar */
  name: string
  columns: ExcelColumn[]
  rows: Record<string, any>[]
}

const NUMBER_FORMATS: Record<Exclude<ExcelCellType, 'text'>, string> = {
  int: '#,##0',
  number: '#,##0.00',
  money: '#,##0.00" ₺"',
  pct: '#,##0.0"%"',
}

/** Metni/dizeyi sayıya çevir (Türkçe ondalık virgülünü de tolere eder). */
function toNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = Number(String(v).replace(/\s|₺|%/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Tek veya çok sayfalı gerçek .xlsx üretir ve indirir.
 * @param sheets Tek sayfa objesi ya da sayfa dizisi
 * @param filename Dosya adı (.xlsx eki otomatik eklenir)
 */
export async function exportXlsx(sheets: ExcelSheet | ExcelSheet[], filename: string): Promise<void> {
  const XLSX = await import('xlsx')
  const list = Array.isArray(sheets) ? sheets : [sheets]
  const wb = XLSX.utils.book_new()

  for (const sheet of list) {
    const { columns, rows } = sheet

    // Başlık + veri satırlarını "array of arrays" olarak kur
    const aoa: any[][] = [columns.map((c) => c.header)]
    for (const row of rows) {
      aoa.push(
        columns.map((c) => {
          const raw = row[c.key]
          if (c.type && c.type !== 'text') {
            const n = toNumber(raw)
            return n === null ? '' : n
          }
          return raw ?? ''
        }),
      )
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa)

    // Sütun genişlikleri (içeriğe göre, üst sınır 45)
    ws['!cols'] = columns.map((c) => {
      if (c.width) return { wch: c.width }
      const dataMax = rows.reduce((m, r) => Math.max(m, String(r[c.key] ?? '').length), 0)
      return { wch: Math.min(Math.max(c.header.length, dataMax) + 2, 45) }
    })

    // Sayı formatları — sadece gerçekten sayı olan hücrelere uygula
    columns.forEach((c, ci) => {
      if (!c.type || c.type === 'text') return
      const fmt = NUMBER_FORMATS[c.type]
      for (let ri = 1; ri <= rows.length; ri++) {
        const cell = ws[XLSX.utils.encode_cell({ r: ri, c: ci })]
        if (cell && cell.t === 'n') cell.z = fmt
      }
    })

    // Başlık satırına otomatik filtre
    if (rows.length > 0 && ws['!ref']) {
      ws['!autofilter'] = { ref: ws['!ref'] }
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31) || 'Sayfa1')
  }

  const name = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, name)
}

/**
 * Export regional surcharges to CSV
 */
export function exportRegionalSurchargesToCSV(surcharges: RegionalPricingSurcharge[]): string {
  const headers = ['Bölge Adı', 'Ek Ücret (₺)', 'Açıklama', 'Aktif']
  const rows = surcharges.map((s) => [
    s.regionKey,
    s.surcharge.toString(),
    s.description,
    s.active ? 'EVET' : 'HAYIR',
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  return csv
}

/**
 * Export province surcharges to CSV
 */
export function exportProvinceSurchargesToCSV(surcharges: ProvincePricingSurcharge[]): string {
  const headers = ['İl Adı', 'Ek Ücret (₺)', 'Açıklama', 'Aktif']
  const rows = surcharges.map((s) => [s.province, s.surcharge.toString(), s.description, s.active ? 'EVET' : 'HAYIR'])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  return csv
}

/**
 * Combined export: both regional and province surcharges
 */
export function exportAllSurchargesToCSV(
  regional: RegionalPricingSurcharge[],
  province: ProvincePricingSurcharge[]
): string {
  let csv = '=== BÖLGE BAZLI FİYATLANDIRMA ===\n'
  csv += exportRegionalSurchargesToCSV(regional)
  csv += '\n\n=== İL BAZLI FİYATLANDIRMA (OVERRIDE) ===\n'
  csv += exportProvinceSurchargesToCSV(province)
  return csv
}

/**
 * Download CSV as file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Parse CSV data (simple implementation)
 */
export function parseCSV(csv: string): string[][] {
  const rows: (string | string[])[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]
    const nextChar = csv[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      rows.push(current.trim())
      current = ''
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (current.trim()) {
        rows.push(current.trim())
        const lastRow = rows[rows.length - 1]
        if (rows.length > 0 && lastRow) {
          rows.push('')
        }
      }
      current = ''
      if (nextChar === '\n') i++
    } else {
      current += char
    }
  }

  if (current.trim()) {
    rows.push(current.trim())
  }

  // Convert flat array to 2D array (rows)
  const result: string[][] = []
  let currentRow: string[] = []

  for (const cell of rows) {
    if (typeof cell === 'string' && cell === '') {
      if (currentRow.length > 0) {
        result.push(currentRow)
        currentRow = []
      }
    } else if (typeof cell === 'string') {
      currentRow.push(cell)
    }
  }

  if (currentRow.length > 0) {
    result.push(currentRow)
  }

  return result
}
