'use client'

import { useToast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white text-sm transition-all',
            toast.variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-gray-200 text-gray-900'
          )}
        >
          <div className="flex-1">
            {toast.title && <p className="font-medium">{toast.title}</p>}
            {toast.description && <p className="text-xs mt-0.5 text-gray-600">{toast.description}</p>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
