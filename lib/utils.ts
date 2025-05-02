import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LeadStatus } from "@/types/lead"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: LeadStatus | string) {
  const statusColors = {
    signed_contract: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    colors: "bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100",
    acv: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
    job: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
    completed_jobs: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    zero_balance: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    denied: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
    follow_ups: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  } as const

  return statusColors[status as keyof typeof statusColors] || ""
}

export function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
