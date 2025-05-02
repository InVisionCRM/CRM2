"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lead } from "@/types/lead"
import { useState } from "react"

interface LeadScopeOfWorkProps {
  lead: Lead
}

export function LeadScopeOfWork({ lead }: LeadScopeOfWorkProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateScopeOfWork = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scope of Work</CardTitle>
        <CardDescription>Define the scope of work for this project</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <p className="text-muted-foreground mb-4">No scope of work has been created yet.</p>
        <Button onClick={handleCreateScopeOfWork} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Scope of Work"}
        </Button>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">
          Status: <span className="font-medium">Pending</span>
        </p>
      </CardFooter>
    </Card>
  )
}
