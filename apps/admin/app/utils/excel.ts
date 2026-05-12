/**
 * Excel export/import utilities for pricing data
 */
import type { RegionalPricingSurcharge, ProvincePricingSurcharge } from '~/types'

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
