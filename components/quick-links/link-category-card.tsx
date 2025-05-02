"use client"

import type { LinkCategoryInfo } from "@/types/quick-links"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LinkCategoryCardProps {
  category: LinkCategoryInfo
  isActive: boolean
  onClick: () => void
}

export function LinkCategoryCard({ category, isActive, onClick }: LinkCategoryCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isActive ? "border-primary bg-primary/5" : "border-border",
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-md", isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
            {category.icon}
          </div>
          <CardTitle className="text-base">{category.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription className="text-xs line-clamp-2">{category.description}</CardDescription>
      </CardContent>
    </Card>
  )
}
