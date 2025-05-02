import type { QuickLink } from "@/types/quick-links"
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { ExternalLink, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface LinkCardProps {
  link: QuickLink
}

export function LinkCard({ link }: LinkCardProps) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="block no-underline text-foreground">
      <Card
        className={cn("h-full transition-all hover:shadow-md", link.featured ? "border-primary/30" : "border-border")}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium flex items-center gap-1">
                {link.title}
                {link.featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
              </h3>
              {link.description && (
                <CardDescription className="mt-1 text-xs line-clamp-2">{link.description}</CardDescription>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="text-xs text-muted-foreground truncate w-full">
            {link.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </p>
        </CardFooter>
      </Card>
    </a>
  )
}
