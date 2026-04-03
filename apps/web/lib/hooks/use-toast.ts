'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastQueue: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

function notify() {
  listeners.forEach((l) => l([...toastQueue]))
}

export function toast(opts: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toastQueue = [...toastQueue, { ...opts, id }]
  notify()
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    notify()
  }, 4000)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Subscribe on mount
  const subscribe = useCallback(() => {
    const handler = (t: Toast[]) => setToasts(t)
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((l) => l !== handler)
    }
  }, [])

  // Run subscription
  useState(() => {
    return subscribe()
  })

  const dismiss = useCallback((id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    notify()
  }, [])

  return { toasts, dismiss }
}
