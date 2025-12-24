import { useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
}

const listeners: Set<(toasts: Toast[]) => void> = new Set()
let memoryState: Toast[] = []

function dispatch(toasts: Toast[]) {
  memoryState = toasts
  listeners.forEach((listener) => listener(toasts))
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState)

  useState(() => {
    listeners.add(setToasts)
    return () => {
      listeners.delete(setToasts)
    }
  })

  const toast = useCallback(
    ({ type, title, description }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newToast: Toast = { id, type, title, description }

      dispatch([...memoryState, newToast])

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        dismiss(id)
      }, 4000)

      return id
    },
    []
  )

  const dismiss = useCallback((toastId: string) => {
    dispatch(memoryState.filter((t) => t.id !== toastId))
  }, [])

  return {
    toasts,
    toast,
    dismiss,
    success: (title: string, description?: string) =>
      toast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      toast({ type: 'error', title, description }),
    info: (title: string, description?: string) =>
      toast({ type: 'info', title, description }),
  }
}
