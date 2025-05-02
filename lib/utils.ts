import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LeadStatus } from "@/types/dashboard"

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

export function formatStatusLabel(status: string | LeadStatus): string {
  if (!status) return "Unknown"
  return status
    .replace(/_/g, " ") // Replace underscores with spaces
    .toLowerCase() // Convert to lowercase
    .split(" ") // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
    .join(" ") // Join back together
}

// --- New Function ---
// Consistent colors based roughly on Tailwind 500 intensity
const markerColors = {
  // NOT_VISITED: "#6b7280", // Removed
  KNOCKED: "#0ea5e9",         // sky-500
  NO_ANSWER: "#3b82f6",       // blue-500
  // INTERESTED: "#8b5cf6",   // Removed
  APPOINTMENT_SET: "#10b981", // emerald-500
  INSPECTED: "#22c55e",       // green-500
  FOLLOW_UP: "#f59e0b",       // amber-500
  NOT_INTERESTED: "#ef4444",  // red-500
  SEARCH: "#ec4899",          // pink-500
  DEFAULT: "#6b7280"          // gray-500 (fallback)
};

/**
 * Returns a hex color code for a given marker status.
 * Handles different string casings and potential null/undefined values.
 */
export function getMarkerColor(status?: string): string {
  if (!status) {
    return markerColors.DEFAULT;
  }

  // Normalize status: uppercase, replace space/hyphen with underscore
  const normalizedStatus = status.toUpperCase().replace(/[-\s]/g, '_');

  switch (normalizedStatus) {
    // case 'NOT_VISITED': // Removed
    //  return markerColors.NOT_VISITED;
    case 'KNOCKED':
      return markerColors.KNOCKED;
    case 'NO_ANSWER':
      return markerColors.NO_ANSWER;
    // case 'INTERESTED': // Removed
    //  return markerColors.INTERESTED;
    case 'APPOINTMENT_SET':
      return markerColors.APPOINTMENT_SET;
    case 'INSPECTED':
      return markerColors.INSPECTED;
    case 'FOLLOW_UP':
      return markerColors.FOLLOW_UP;
    case 'NOT_INTERESTED':
      return markerColors.NOT_INTERESTED;
    case 'SEARCH': // Handle search status explicitly if needed
      return markerColors.SEARCH;
    // Handle potential legacy or alternative names if necessary
    case 'NOT_HOME': // Example: map "Not Home" to "No Answer"
      return markerColors.NO_ANSWER;
    case 'IN_CONTRACT': // Example: map "In Contract" if used
        return markerColors.SEARCH; // Return Pink (#ec4899)
    default:
      console.warn(`Unknown marker status received: "${status}" (Normalized: "${normalizedStatus}")`);
      return markerColors.DEFAULT;
  }
}
