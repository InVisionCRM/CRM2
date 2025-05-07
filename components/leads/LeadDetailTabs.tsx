"use client"

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Lead } from "@prisma/client"
import { ContactForm } from "@/components/forms/ContactForm"
import { InsuranceForm } from "@/components/forms/InsuranceForm"
import { AdjusterForm } from "@/components/forms/AdjusterForm"
import { LeadOverviewTab } from "./tabs/LeadOverviewTab"
import { LeadNotesTab } from "./tabs/LeadNotesTab"
import { LeadFilesTab } from "./tabs/LeadFilesTab"
import { LeadContractsTab } from "./tabs/LeadContractsTab"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown } from "lucide-react";

interface LeadDetailTabsProps {
  lead: Lead | null;
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TABS_CONFIG = [
  { value: "overview", label: "Overview", Component: LeadOverviewTab },
  { value: "contact", label: "Contact", Component: ContactForm },
  { value: "insurance", label: "Insurance", Component: InsuranceForm },
  { value: "adjuster", label: "Adjuster", Component: AdjusterForm },
  { value: "notes", label: "Notes", Component: LeadNotesTab },
  { value: "files", label: "Files", Component: LeadFilesTab },
  { value: "contracts", label: "Contract", Component: LeadContractsTab },
];

export function LeadDetailTabs({ lead, activeTab, onTabChange }: LeadDetailTabsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!lead) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="h-10 bg-muted rounded w-1/2 mb-4 animate-pulse"></div>
          <div className="h-40 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const CurrentComponent = TABS_CONFIG.find(tab => tab.value === activeTab)?.Component;

  const getInitialDataForForm = (tabValue: string) => {
    switch (tabValue) {
      case 'contact':
        return {
          firstName: lead.firstName || "", lastName: lead.lastName || "",
          email: lead.email || "", phone: lead.phone || "",
          address: lead.address || "",
        };
      case 'insurance':
        return {
          insuranceCompany: lead.insuranceCompany || "",
          insurancePolicyNumber: lead.insurancePolicyNumber || "",
          insurancePhone: lead.insurancePhone || "",
          insuranceDeductible: lead.insuranceDeductible || "",
          insuranceSecondaryPhone: lead.insuranceSecondaryPhone || "",
          dateOfLoss: lead.dateOfLoss ? new Date(lead.dateOfLoss).toISOString().split('T')[0] : "",
          damageType: lead.damageType as any || undefined,
          claimNumber: lead.claimNumber || "",
        };
      case 'adjuster':
        return {
          insuranceAdjusterName: lead.insuranceAdjusterName || "",
          insuranceAdjusterPhone: lead.insuranceAdjusterPhone || "",
          insuranceAdjusterEmail: lead.insuranceAdjusterEmail || "",
          adjusterAppointmentDate: lead.adjusterAppointmentDate 
            ? new Date(lead.adjusterAppointmentDate).toISOString().split('T')[0]
            : "",
          adjusterAppointmentTime: lead.adjusterAppointmentTime || "",
          adjusterAppointmentNotes: lead.adjusterAppointmentNotes || "",
        };
      default:
        return {};
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full" activationMode="manual">
      {isMobile ? (
        <div className="mb-4">
          <Select value={activeTab} onValueChange={onTabChange}>
            <SelectTrigger className="w-full text-base py-3 flex justify-center items-center">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {TABS_CONFIG.map((tab) => (
                <SelectItem key={tab.value} value={tab.value} className="text-base py-2 flex justify-center items-center">
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 mb-4 bg-muted/50 p-1 rounded-lg">
          {TABS_CONFIG.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value} 
              className="text-xs sm:text-sm flex justify-center items-center border-b-2 border-transparent hover:border-border data-[state=active]:border-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-2.5"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      
      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-6 min-h-[400px]">
          {/* Render only the active tab's content directly */} 
          {CurrentComponent && (
            <CurrentComponent 
              lead={lead} // Pass lead for overview and specific tabs
              leadId={lead.id} // Pass leadId for forms and specific tabs
              initialData={getInitialDataForForm(activeTab)} // Pass initialData for forms
              onSuccess={() => {
                // console.log(`${TABS_CONFIG.find(t=>t.value===activeTab)?.label} form submitted successfully`);
              }}
            />
          )}
        </CardContent>
      </Card>
    </Tabs>
  )
} 