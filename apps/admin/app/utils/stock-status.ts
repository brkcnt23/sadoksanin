/**
 * Stock status utilities for 3-level warning system
 */

export type StockStatus = 'green' | 'orange' | 'red'
export type StockStatusLabel = 'Normal' | 'Orta Uyarı' | 'Kritik'

export interface StockStatusResult {
  status: StockStatus
  label: StockStatusLabel
  color: string
  backgroundColor: string
  borderColor: string
}

/**
 * Determine stock status based on current stock and thresholds
 * - Green: above middleStock (or above minimumStock if middleStock not set)
 * - Orange: between minimum and middle (only if middleStock is set)
 * - Red: below or equal to minimumStock
 */
export function getStockStatus(
  currentStock: number,
  minimumStock: number,
  middleStock?: number
): StockStatus {
  // If stock is below/equal minimum, it's critical (red)
  if (currentStock <= minimumStock) {
    return 'red'
  }

  // If middle stock is not defined, only have red/green
  if (!middleStock || middleStock <= minimumStock) {
    return 'green'
  }

  // If between minimum and middle, it's warning (orange)
  if (currentStock <= middleStock) {
    return 'orange'
  }

  // Otherwise it's normal (green)
  return 'green'
}

/**
 * Get display info for stock status
 */
export function getStockStatusInfo(status: StockStatus): StockStatusResult {
  const statusMap: Record<StockStatus, StockStatusResult> = {
    green: {
      status: 'green',
      label: 'Normal',
      color: 'text-green-700',
      backgroundColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    orange: {
      status: 'orange',
      label: 'Orta Uyarı',
      color: 'text-orange-700',
      backgroundColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    red: {
      status: 'red',
      label: 'Kritik',
      color: 'text-red-700',
      backgroundColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  }

  return statusMap[status]
}

/**
 * Get badge variant for UI components
 */
export function getStockStatusBadgeVariant(status: StockStatus): 'success' | 'warning' | 'error' {
  const variantMap: Record<StockStatus, 'success' | 'warning' | 'error'> = {
    green: 'success',
    orange: 'warning',
    red: 'error',
  }

  return variantMap[status]
}

/**
 * Composite: get status and info in one call
 */
export function getStockStatusAndInfo(
  currentStock: number,
  minimumStock: number,
  middleStock?: number
) {
  const status = getStockStatus(currentStock, minimumStock, middleStock)
  const info = getStockStatusInfo(status)
  const { status: _, ...rest } = info
  return { status, ...rest }
}
