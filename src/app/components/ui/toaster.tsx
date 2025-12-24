import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const toastStyles = {
  success: 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
  error: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400',
  info: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px] gap-2">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all',
              'animate-in slide-in-from-top-full sm:slide-in-from-bottom-full',
              toastStyles[toast.type]
            )}
          >
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description && (
                <div className="text-sm opacity-90">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
