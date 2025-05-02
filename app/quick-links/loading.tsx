import { Skeleton } from "@/components/ui/skeleton"

export default function QuickLinksLoading() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Skeleton className="h-10 w-10 rounded-md mr-2" />
        <Skeleton className="h-8 w-40" />
      </div>

      <Skeleton className="h-10 w-full mb-6" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
      </div>

      <Skeleton className="h-8 w-40 mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
      </div>
    </div>
  )
}
