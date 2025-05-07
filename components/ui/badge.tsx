import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import type { LeadStatus } from "@prisma/client"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        signed_contract: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
        scheduled: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
        colors: "border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100",
        acv: "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
        job: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
        completed_jobs: "border-transparent bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        zero_balance: "border-transparent bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        denied: "border-transparent bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
        follow_ups: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  variant?: "default" | "secondary" | "destructive" | "outline" | LeadStatus
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
