import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container px-4 py-4 mx-auto max-w-7xl">
      <div className="flex items-center mb-6">
        <Skeleton className="h-10 w-10 rounded-full mr-2" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
