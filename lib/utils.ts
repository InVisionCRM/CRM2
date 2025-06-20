import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LeadStatus } from "@prisma/client"

/**
 * Merges class names with Tailwind CSS classes and resolves conflicts
 * @param inputs - Class name inputs
 * @returns Merged and deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: LeadStatus | string): string {
  // Handle potential string input if necessary, but primarily use enum
  const statusEnum = Object.values(LeadStatus).find(val => val === status) ?? status;
  switch (statusEnum) {
    case LeadStatus.signed_contract:
      return "bg-blue-500 text-white-800 dark:bg-blue-800 dark:text-blue-100"
    case LeadStatus.scheduled:
      return "bg-purple-500 text-white-800 dark:bg-purple-800 dark:text-purple-100"
    case LeadStatus.colors:
      return "bg-purple-500 text-white-800 dark:bg-purple-800 dark:text-purple-100"
    case LeadStatus.acv:
      return "bg-yellow-500 text-white-800 dark:bg-yellow-800 dark:text-yellow-100"
    case LeadStatus.job:
      return "bg-indigo-500 text-white-800 dark:bg-indigo-800 dark:text-indigo-100"
    case LeadStatus.completed_jobs:
      return "bg-green-500 text-white-800 dark:bg-green-800 dark:text-green-100"
    case LeadStatus.zero_balance:
      return "bg-gray-500 text-white-800 dark:bg-gray-700 dark:text-gray-100"
    case LeadStatus.denied:
      return "bg-red-500 text-white-800 dark:bg-red-800 dark:text-white"
    case LeadStatus.follow_ups:
      return "bg-white text-black dark:bg-orange-800 dark:text-orange-100"
    default:
      return "bg-gray-500 text-white-800 dark:bg-gray-700 dark:text-gray-100" // Default fallback
  }
}

export function formatStatusLabel(status: LeadStatus | string): string {
  if (!status) return "Unknown"
  // Handle potential string input if necessary, but primarily use enum
  const statusEnum = Object.values(LeadStatus).find(val => val === status) ?? status;
  switch (statusEnum) {
    case LeadStatus.signed_contract:
      return "Signed Contract"
    case LeadStatus.scheduled:
      return "Scheduled"
    case LeadStatus.colors:
      return "Colors"
    case LeadStatus.acv:
      return "ACV"
    case LeadStatus.job:
      return "Job"
    case LeadStatus.completed_jobs:
      return "Completed Jobs"
    case LeadStatus.zero_balance:
      return "Zero Balance"
    case LeadStatus.denied:
      return "Denied"
    case LeadStatus.follow_ups:
      return "Follow Ups"
    default:
      // Fallback for potentially unconverted string or unknown enum value
      return typeof status === 'string' ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Unknown Status";
  }
}

// --- New Function ---
// Consistent colors based roughly on Tailwind 500 intensity
const markerColors = {
  // NOT_VISITED: "#6b7280", // Removed
  KNOCKED: "#0ea5e9",         // sky-500 ("New")
  NO_ANSWER: "#3b82f6",       // blue-500
  // INTERESTED: "#8b5cf6",   // Removed
  // APPOINTMENT_SET: "#10b981", // Removed
  INSPECTED: "#22c55e",       // green-500
  FOLLOW_UP: "#f59e0b",       // amber-500
  NOT_INTERESTED: "#ef4444",  // red-500
  IN_CONTRACT: "#a855f7",      // purple-500 (Added)
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
    case 'KNOCKED': // Maps to "New" on frontend
      return markerColors.KNOCKED;
    case 'NO_ANSWER':
      return markerColors.NO_ANSWER;
    // case 'INTERESTED': // Removed
    //  return markerColors.INTERESTED;
    // case 'APPOINTMENT_SET': // Removed
    //  return markerColors.APPOINTMENT_SET;
    case 'INSPECTED':
      return markerColors.INSPECTED;
    case 'FOLLOW_UP':
      return markerColors.FOLLOW_UP;
    case 'NOT_INTERESTED':
      return markerColors.NOT_INTERESTED;
    case 'IN_CONTRACT': // Added
      return markerColors.IN_CONTRACT;
    case 'SEARCH': // Handle search status explicitly if needed
      return markerColors.SEARCH;
    // Handle potential legacy or alternative names if necessary
    // case 'NOT_HOME': // Removed
    //   return markerColors.NO_ANSWER;
    default:
      console.warn(`Unknown marker status received: "${status}" (Normalized: "${normalizedStatus}")`);
      return markerColors.DEFAULT;
  }
}

/**
 * Get subtle background gradient classes for activity types
 */
export function getActivityColorClasses(activityType: string) {
  switch (activityType) {
    case 'LEAD_CREATED':
      return 'bg-gradient-to-r from-emerald-50/50 to-green-50/50 border-l-4 border-emerald-200'
    case 'LEAD_UPDATED':
      return 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-l-4 border-blue-200'
    case 'NOTE_ADDED':
      return 'bg-gradient-to-r from-amber-50/50 to-yellow-50/50 border-l-4 border-amber-200'
    case 'MEETING_SCHEDULED':
      return 'bg-gradient-to-r from-purple-50/50 to-violet-50/50 border-l-4 border-purple-200'
    case 'DOCUMENT_UPLOADED':
      return 'bg-gradient-to-r from-slate-50/50 to-gray-50/50 border-l-4 border-slate-200'
    case 'ESTIMATE_CREATED':
      return 'bg-gradient-to-r from-cyan-50/50 to-teal-50/50 border-l-4 border-cyan-200'
    case 'CONTRACT_CREATED':
      return 'bg-gradient-to-r from-rose-50/50 to-pink-50/50 border-l-4 border-rose-200'
    case 'STATUS_CHANGED':
      return 'bg-gradient-to-r from-orange-50/50 to-red-50/50 border-l-4 border-orange-200'
    case 'APPOINTMENT_CREATED':
      return 'bg-gradient-to-r from-fuchsia-50/50 to-purple-50/50 border-l-4 border-fuchsia-200'
    case 'APPOINTMENT_UPDATED':
      return 'bg-gradient-to-r from-sky-50/50 to-blue-50/50 border-l-4 border-sky-200'
    default:
      return 'bg-gradient-to-r from-gray-50/50 to-slate-50/50 border-l-4 border-gray-200'
  }
}
