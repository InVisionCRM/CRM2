import { useMapContext } from "./map-context"

export function MapLoadingOverlay() {
  const { isLoading } = useMapContext()

  if (!isLoading) return null

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-lg font-medium text-foreground">Loading Map...</p>
      </div>
    </div>
  )
} 