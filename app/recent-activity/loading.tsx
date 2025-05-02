import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container px-4 py-4 mx-auto max-w-7xl">
      <div className="flex items-center mb-6">
        <Skeleton className="h-10 w-10 rounded-md mr-2" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-[300px] w-full rounded-lg" />

        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    </div>
  )
}
