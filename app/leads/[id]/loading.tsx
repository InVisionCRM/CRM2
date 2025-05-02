import { Skeleton } from "@/components/ui/skeleton"

export default function LeadDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Content skeleton */}
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  )
}
