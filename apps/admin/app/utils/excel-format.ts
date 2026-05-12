/**
 * Excel formatting utilities for currency and number formatting
 */

export interface CurrencyFormat {
  format: string
  symbol: string
}

export const CURRENCY_FORMATS: Record<string, CurrencyFormat> = {
  USD: { format: '$#,##0.00', symbol: '$' },
  EUR: { format: '€#,##0.00', symbol: '€' },
  GBP: { format: '£#,##0.00', symbol: '£' },
  TRY: { format: '₺#,##0.00', symbol: '₺' },
  AED: { format: '#,##0.00 د.إ', symbol: 'د.إ' },
}

export const DEFAULT_CURRENCY_FORMAT = CURRENCY_FORMATS.TRY

/**
 * Apply currency formatting to a worksheet
 * Detects common currency column names and applies formatting
 */
export function applyCurrencyFormatting(ws: any, headers: string[]) {
  if (!ws || !ws['!ref']) return

  // Common currency-related column names (in Turkish and English)
  const currencyColumnPatterns = [
    /fiyat|price|ücret|birim fiyat|unit price|cost|maliyet|vergi|tax|indirim|discount|tutar|amount|toplam|total|alt toplam|subtotal|ek ücret|surcharge|kur|rate|bakiye|balance/i,
  ]

  const range = ws['!ref'].split(':')
  const startCol = range[0].match(/[A-Z]+/)?.[0] || 'A'
  const endCol = range[1]?.match(/[A-Z]+/)?.[0] || 'Z'
  const startColNum = startCol.charCodeAt(0) - 65
  const endColNum = endCol.charCodeAt(0) - 65

  // Apply currency format to currency columns
  for (let colNum = startColNum; colNum <= endColNum; colNum++) {
    const colLetter = String.fromCharCode(65 + colNum)
    const headerCell = colLetter + '1'

    if (ws[headerCell]) {
      const headerText = ws[headerCell].v || ''

      // Check if this column is a currency column
      const isCurrencyColumn = currencyColumnPatterns.some(pattern => pattern.test(headerText))

      if (isCurrencyColumn) {
        // Apply TRY format by default for Turkish Lira
        applyColumnCurrencyFormat(ws, colLetter, 'TRY')
      }
    }
  }
}

/**
 * Apply currency format to an entire column
 */
export function applyColumnCurrencyFormat(ws: any, colLetter: string, currency: string = 'TRY') {
  if (!ws['!ref']) return

  const format = CURRENCY_FORMATS[currency] || DEFAULT_CURRENCY_FORMAT
  if (!format) return
  const range = ws['!ref'].split(':')
  const endRow = parseInt(range[1]?.match(/\d+$/)?.[0] || '1') || 1000

  // Start from row 2 (skip header)
  for (let row = 2; row <= endRow; row++) {
    const cellAddress = colLetter + row
    if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
      ws[cellAddress].z = format.format
    }
  }
}

/**
 * Apply currency format to specific cells
 */
export function applyCellCurrencyFormat(ws: any, cellAddresses: string[], currency: string = 'TRY') {
  const format = CURRENCY_FORMATS[currency] || DEFAULT_CURRENCY_FORMAT
  if (!format) return

  for (const cellAddress of cellAddresses) {
    if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
      ws[cellAddress].z = format.format
    }
  }
}

/**
 * Format a row object to detect currency columns and apply formatting
 */
export function formatRowsWithCurrency(
  rows: any[],
  currencyColumns: Record<string, string> = {}
): { rows: any[]; cellFormats: Record<string, string> } {
  const cellFormats: Record<string, string> = {}

  if (rows.length === 0) return { rows, cellFormats }

  // Detect currency columns from first row keys
  const firstRow = rows[0]
  const detectedCurrencies: Record<string, string> = { ...currencyColumns }

  // If no explicit currency columns provided, try to detect them
  if (Object.keys(detectedCurrencies).length === 0) {
    const currencyPattern =
      /fiyat|price|ücret|birim fiyat|unit price|cost|maliyet|vergi|tax|indirim|discount|tutar|amount|toplam|total|alt toplam|subtotal|ek ücret|surcharge|bakiye|balance/i

    for (const key of Object.keys(firstRow)) {
      if (currencyPattern.test(key)) {
        detectedCurrencies[key] = 'TRY' // Default to TRY
      }
    }
  }

  // Store formats for later application
  for (const [colKey, currency] of Object.entries(detectedCurrencies)) {
    const format = CURRENCY_FORMATS[currency] || DEFAULT_CURRENCY_FORMAT
    if (format) {
      cellFormats[colKey] = format.format
    }
  }

  return { rows, cellFormats }
}

/**
 * Apply detected currency formats to worksheet
 */
export function applyDetectedFormats(ws: any, cellFormats: Record<string, string>, headerRow: string[]) {
  const colMap: Record<string, string> = {}

  // Map column names to column letters
  for (let i = 0; i < headerRow.length; i++) {
    const colLetter = String.fromCharCode(65 + i)
    const headerKey = headerRow[i]
    if (headerKey) {
      colMap[headerKey] = colLetter
    }
  }

  // Apply formats
  const range = ws['!ref'].split(':')
  const endRow = parseInt(range[1]?.match(/\d+$/)?.[0] || '1') || 1000

  for (const [colKey, format] of Object.entries(cellFormats)) {
    const colLetter = colMap[colKey]
    if (!colLetter) continue

    for (let row = 2; row <= endRow; row++) {
      const cellAddress = colLetter + row
      if (ws[cellAddress] && typeof ws[cellAddress].v === 'number') {
        ws[cellAddress].z = format
      }
    }
  }
}
