import type React from "react"
export type LinkCategory =
  | "permits"
  | "suppliers"
  | "safety"
  | "insurance"
  | "utilities"
  | "government"
  | "tools"
  | "other"

export interface QuickLink {
  id: string
  title: string
  url: string
  description?: string
  category: LinkCategory
  icon?: string
  featured?: boolean
}

export interface LinkCategoryInfo {
  id: LinkCategory
  name: string
  description: string
  icon: React.ReactNode
}
