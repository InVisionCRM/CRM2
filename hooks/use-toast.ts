"use client"
import { useState, useRef, useCallback, useEffect } from "react"
import type { ToastActionElement } from "@/components/ui/toast"

import { nanoid } from "nanoid"

export type Toast = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: ToastActionElement
}

export type ToastInput = Omit<Toast, "id">

export function useToast(maxToasts = 3, defaultDuration = 3000) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const toast = useCallback(
    (props: ToastInput, duration = defaultDuration) => {
      const id = nanoid()
      const newToast: Toast = { id, ...props }

      setToasts((all) => [newToast, ...all].slice(0, maxToasts))

      const timer = setTimeout(() => {
        setToasts((all) => all.filter((t) => t.id !== id))
        timers.current.delete(id)
      }, duration)

      timers.current.set(id, timer)

      return {
        id,
        dismiss: () => {
          clearTimeout(timer)
          setToasts((all) => all.filter((t) => t.id !== id))
          timers.current.delete(id)
        },
      }
    },
    [maxToasts, defaultDuration],
  )

  return { toasts, toast }
}
