export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])
let counter = 0

export function useToast() {
  function push(message: string, type: Toast['type'] = 'info', duration = 4000): string {
    const id = `toast-${++counter}-${Date.now()}`
    const toast: Toast = { id, message, type, duration }
    toasts.value = [...toasts.value, toast]
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts: readonly(toasts), push, dismiss }
}
