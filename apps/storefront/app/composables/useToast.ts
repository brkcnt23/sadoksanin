/**
 * Hafif toast queue. <SiteToast /> tarafından dinlenir.
 * useState() Nuxt SSR-safe state.
 */

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastMessage {
  id: number
  title: string
  description?: string
  variant: ToastVariant
  duration: number
}

export const useToast = () => {
  const toasts = useState<ToastMessage[]>('toasts', () => [])
  const counter = useState<number>('toast-counter', () => 0)

  const push = (input: Omit<ToastMessage, 'id' | 'duration'> & { duration?: number }) => {
    counter.value += 1
    const id = counter.value
    const message: ToastMessage = {
      id,
      duration: input.duration ?? 6000,
      variant: input.variant,
      title: input.title,
      description: input.description,
    }
    toasts.value = [...toasts.value, message]

    if (import.meta.client && message.duration > 0) {
      setTimeout(() => dismiss(id), message.duration)
    }
    return id
  }

  const dismiss = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const clear = () => {
    toasts.value = []
  }

  return { toasts, push, dismiss, clear }
}
