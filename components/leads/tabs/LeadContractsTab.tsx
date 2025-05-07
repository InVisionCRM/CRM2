"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileSignature, PlusCircle } from "lucide-react"
import Link from "next/link"

interface LeadContract {
  id: string;
  name: string;
  status: "Draft" | "Sent" | "Signed" | "Expired";
  signedDate?: string;
  url?: string; // Link to the contract document or system
}

interface LeadContractsTabProps {
  leadId: string;
}

export function LeadContractsTab({ leadId }: LeadContractsTabProps) {
  // Mock data - replace with actual API call
  const contracts: LeadContract[] = [
    {
      id: "contract1",
      name: "Initial Service Agreement",
      status: "Signed",
      signedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      url: "https://contracts.example.com/view/123",
    },
    {
      id: "contract2",
      name: "Addendum A - Material Changes",
      status: "Draft",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contract Management</CardTitle>
          {/* This could link to an external system or an internal creation page */}
          <Button asChild variant="outline">
            <Link href={`/contracts/new?leadId=${leadId}`} target="_blank" rel="noopener noreferrer">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Contract
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No contracts associated with this lead yet.</p>
              <p className="text-sm text-muted-foreground">You can create a new contract using the button above.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {contracts.map((contract) => (
                <li key={contract.id} className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-semibold text-md">{contract.name}</h3>
                    <p className={`text-sm ${contract.status === "Signed" ? "text-green-600" : "text-muted-foreground"}`}>
                      Status: {contract.status}
                      {contract.status === "Signed" && contract.signedDate && (
                        <span className="ml-2 text-xs"> (Signed: {new Date(contract.signedDate).toLocaleDateString()})</span>
                      )}
                    </p>
                  </div>
                  {contract.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={contract.url} target="_blank" rel="noopener noreferrer">
                        View Contract <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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