import type { LucideIcon } from "lucide-react"

export interface DocumentCategoryType {
  id: string
  name: string
  icon: LucideIcon
  color: string
  bgColor: string
}

export interface LeadFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  category: string
  uploadedAt: string | Date
}
