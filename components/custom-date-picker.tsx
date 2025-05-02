"use client"

import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CustomDatePickerProps {
  selected?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function CustomDatePicker({ selected, onChange, minDate, maxDate, className }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(selected || new Date())

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth)
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-12 justify-start text-left font-normal border-2 hover:bg-accent",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
          {selected ? (
            <span className="text-sm font-medium">
              {format(selected, "EEE, MMM d, yyyy")}
            </span>
          ) : (
            "Select date"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handleMonthChange("prev")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handleMonthChange("next")}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true
                if (maxDate && date > maxDate) return true
                return false
              }}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border scale-150 transform origin-top-left p-3"
              classNames={{
                head_cell: "text-muted-foreground font-medium text-[0.8rem]",
                cell: cn(
                  "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                ),
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                ),
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                nav_button: "hidden",
                nav: "hidden",
              }}
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
