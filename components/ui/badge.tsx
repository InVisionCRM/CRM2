import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, getStatusColor } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        signed_contract: cn("border-transparent", getStatusColor("signed_contract")),
        scheduled: cn("border-transparent", getStatusColor("scheduled")),
        colors: cn("border-transparent", getStatusColor("colors")),
        acv: cn("border-transparent", getStatusColor("acv")),
        job: cn("border-transparent", getStatusColor("job")),
        completed_jobs: cn("border-transparent", getStatusColor("completed_jobs")),
        zero_balance: cn("border-transparent", getStatusColor("zero_balance")),
        denied: cn("border-transparent", getStatusColor("denied")),
        follow_ups: cn("border-transparent", getStatusColor("follow_ups")),
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
  const finalVariant = typeof variant === 'string' && Object.values(LeadStatus).includes(variant as LeadStatus) ? variant as LeadStatus : variant;
  return <div className={cn(badgeVariants({ variant: finalVariant as any }), className)} {...props} />
}

export { Badge, badgeVariants }
