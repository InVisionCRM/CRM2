"use client"

import { useState, useEffect } from "react"
import { addDays, isBefore, startOfToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Clock, CalendarDays } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Generate time slots from 8:00 AM to 7:30 PM in 30-minute increments
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = (i % 2) * 30
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return {
    value: `${displayHour}:${minute === 0 ? "00" : minute} ${period}`,
    display: `${displayHour}:${minute === 0 ? "00" : minute} ${period}`,
  }
}).filter((slot) => {
  const [time, period] = slot.display.split(" ")
  const [hour, minute] = time.split(":").map(Number)
  if (period === "PM" && hour === 7 && minute > 30) return false
  if (period === "PM" && hour > 7) return false
  return true
})

interface FollowUpSchedulerProps {
  isOpen: boolean
  onClose: () => void
  onScheduled: (date: Date, time: string, notes: string) => void
  initialDate?: Date | null
  initialTime?: string
  initialNotes?: string
}

export function FollowUpScheduler({
  isOpen,
  onClose,
  onScheduled,
  initialDate,
  initialTime,
  initialNotes = "",
}: FollowUpSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate || undefined)
  const [time, setTime] = useState<string | null>(initialTime || null)
  const [notes, setNotes] = useState<string>(initialNotes)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || undefined)
      setTime(initialTime || null)
      setNotes(initialNotes)
    }
  }, [isOpen, initialDate, initialTime, initialNotes])

  const handleSubmit = async () => {
    if (!date || !time) {
      // You can add your toast notification here
      return
    }

    try {
      setIsSubmitting(true)
      onScheduled(date, time, notes)
      onClose()

      // You can add your toast notification here
    } catch (error) {
      console.error("Error scheduling follow-up:", error)
      // You can add your toast notification here
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setDate(undefined)
    setTime(null)
    setNotes("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 text-black sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium flex items-center text-gray-900">
            <CalendarDays className="mr-2 h-5 w-5 text-primary" />
            Schedule Follow-Up
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Select a date and time for your follow-up visit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="font-medium text-sm text-gray-300">Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300 bg-white hover:bg-gray-100",
                      !date && "text-gray-400",
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-gray-200">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => isBefore(date, startOfToday()) || isBefore(addDays(startOfToday(), 30), date)}
                    className="bg-white text-black"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm text-gray-300">Time</div>
              <Select value={time || ""} onValueChange={setTime}>
                <SelectTrigger className="border-gray-300 bg-white hover:bg-gray-100">
                  <SelectValue placeholder="Select time">
                    {time ? (
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {time}
                      </div>
                    ) : (
                      "Select time"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-black">
                  <SelectGroup>
                    <SelectLabel>Morning</SelectLabel>
                    {TIME_SLOTS.filter((slot) => slot.display.includes("AM")).map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.display}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Afternoon</SelectLabel>
                    {TIME_SLOTS.filter((slot) => slot.display.includes("PM") && Number.parseInt(slot.display) < 5).map(
                      (slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.display}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Evening</SelectLabel>
                    {TIME_SLOTS.filter((slot) => slot.display.includes("PM") && Number.parseInt(slot.display) >= 5).map(
                      (slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.display}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-sm text-gray-300">Notes</div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any details about the follow-up"
              className="bg-white border-gray-300 text-black min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCancel} className="border-gray-300 bg-white hover:bg-gray-100">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !date || !time}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Follow-Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
