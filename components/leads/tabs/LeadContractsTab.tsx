"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface LeadContractsTabProps {
  leadId: string;
}

export function LeadContractsTab({ leadId }: LeadContractsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>External Contract System</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            For full contract lifecycle management, access our dedicated contract system.
          </p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
            <Link href="https://contracts.purlin.pro/" target="_blank" rel="noopener noreferrer">
              Open Purlin Contracts <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 