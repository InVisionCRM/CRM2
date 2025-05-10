"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  value?: string
  onChange: (value: string) => void
}

export function TimePicker({ value = "12:00", onChange }: TimePickerProps) {
  const [time, setTime] = useState(value)

  useEffect(() => {
    if (value !== time) {
      setTime(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    onChange(newTime)
  }

  return <Input type="time" value={time} onChange={handleChange} className="w-full" />
}
