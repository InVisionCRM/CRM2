import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-gray-600" />
          <Skeleton className="h-4 w-64 bg-gray-600" />
        </div>
        <Skeleton className="h-9 w-32 mt-4 sm:mt-0 bg-gray-600" />
      </div>

      {/* Status filters and controls skeleton */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <Skeleton className="h-9 w-32 bg-gray-600" />
        <Skeleton className="h-9 w-24 bg-gray-600" />
        <Skeleton className="h-9 w-28 bg-gray-600" />
      </div>

      {/* Leads list skeleton */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="overflow-hidden border border-lime-700 bg-transparent bg-black/50 rounded-lg shadow-sm">
            {/* Compact Row Skeleton */}
            <div className="flex items-center justify-between p-4 bg-black/50">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Salesperson Avatar Skeleton */}
                <div className="flex-shrink-0">
                  <Skeleton className="w-8 h-8 rounded-full bg-gray-600" />
                </div>

                {/* Lead Name Skeleton */}
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-32 sm:w-48 bg-gray-600" />
                </div>

                {/* Status Badge Skeleton */}
                <div className="flex-shrink-0">
                  <Skeleton className="h-6 w-20 rounded-full bg-gray-600" />
                </div>
              </div>

              {/* Expand Button Skeleton */}
              <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                <Skeleton className="h-8 w-8 rounded bg-gray-600" />
              </div>
            </div>

            {/* Show expanded skeleton for first item */}
            {i === 0 && (
              <div className="border-t border-gray-700 bg-gradient-to-b from-green-900/20 via-blue-900/20 to-gray-900 p-4 space-y-4">
                {/* Street View and Quick Note Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Street View Skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-48 w-full rounded-lg bg-gray-700" />
                  </div>

                  {/* Quick Note Skeleton */}
                  <div className="space-y-2 justify-center flex flex-col w-full">
                    <Skeleton className="h-20 w-full rounded bg-gray-700" />
                    <Skeleton className="h-8 w-24 rounded bg-gray-700" />
                  </div>
                </div>

                {/* Quick Action Tabs Skeleton */}
                <div className="border-t border-lime-500/90 pt-4">
                  <Skeleton className="h-6 w-24 mx-auto mb-3 bg-gray-600" />
                  <div className="flex w-full border-t border-b-[2px] border-lime-500 rounded-lg overflow-hidden">
                    {[...Array(5)].map((_, j) => (
                      <Skeleton key={j} className="h-16 flex-1 bg-gray-700" />
                    ))}
                  </div>
                </div>

                {/* Event Creation Buttons Skeleton */}
                <div className="border-t border-lime-500/90 pt-4">
                  <Skeleton className="h-6 w-28 mx-auto mb-3 bg-gray-600" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, j) => (
                      <Skeleton key={j} className="h-16 rounded bg-gray-700" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg mt-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-8 bg-gray-300" />
          <Skeleton className="h-8 w-16 bg-gray-300" />
          <Skeleton className="h-4 w-16 bg-gray-300" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-20 bg-gray-300" />
          <div className="flex items-center space-x-1">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className="h-8 w-8 bg-gray-300" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
