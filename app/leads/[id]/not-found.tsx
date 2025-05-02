import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LeadNotFound() {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Lead Not Found</h1>
      <p className="text-muted-foreground mb-6">The lead you are looking for does not exist or has been removed.</p>
      <Button asChild>
        <Link href="/leads">Back to Leads</Link>
      </Button>
    </div>
  )
}
