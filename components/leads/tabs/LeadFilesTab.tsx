"use client"

import { LeadFiles } from "@/components/leads/lead-files";

interface LeadFilesTabProps {
  leadId: string;
}

export function LeadFilesTab({ leadId }: LeadFilesTabProps) {
  return <LeadFiles leadId={leadId} />;
} 