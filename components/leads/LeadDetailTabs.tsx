"use client"

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface LeadDetailTabsProps {
  lead: Lead | null;
  activeTab: string;
  onTabChange: (value: string) => void;
}

// Define type for the section being edited
type EditableSection = 'contact' | 'insurance' | 'adjuster';

const TABS_CONFIG = [
  { value: "overview", label: "Overview", Component: LeadOverviewTab },
  { value: "notes", label: "Notes", Component: LeadNotesTab },
  { value: "files", label: "Files", Component: LeadFilesTab },
  { value: "contracts", label: "Contract", Component: LeadContractsTab },
];

export function LeadDetailTabs({ lead, activeTab, onTabChange }: LeadDetailTabsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [formToEdit, setFormToEdit] = useState<EditableSection | null>(null); // Added state for form editing

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleActualTabChange = (value: string) => {
    setFormToEdit(null); // Clear any open form when changing main tabs
    onTabChange(value);
  };

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

  const ActiveTabComponent = TABS_CONFIG.find(tab => tab.value === activeTab)?.Component;

  const getInitialDataForForm = (formType: EditableSection) => {
    switch (formType) {
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

  const handleFormSuccess = (formType: EditableSection) => {
    console.log(`${formType} form submitted successfully`);
    setFormToEdit(null);
    // Potentially add lead data refetching logic here
    // e.g. router.refresh() or a custom callback from parent
  };

  const handleFormCancel = () => {
    setFormToEdit(null);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleActualTabChange} className="w-full" activationMode="manual">
      {isMobile ? (
        <div className="mb-4">
          <Select value={activeTab} onValueChange={handleActualTabChange}>
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
        <TabsList className="grid w-full grid-cols-4 mb-4 bg-muted/50 p-1 rounded-lg">
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
          {formToEdit === 'contact' ? (
            <ContactForm
              leadId={lead.id}
              initialData={getInitialDataForForm('contact')}
              onSuccess={() => handleFormSuccess('contact')}
              onCancel={handleFormCancel}
            />
          ) : formToEdit === 'insurance' ? (
            <InsuranceForm
              leadId={lead.id}
              initialData={getInitialDataForForm('insurance')}
              onSuccess={() => handleFormSuccess('insurance')}
              onCancel={handleFormCancel}
            />
          ) : formToEdit === 'adjuster' ? (
            <AdjusterForm
              leadId={lead.id}
              initialData={getInitialDataForForm('adjuster')}
              onSuccess={() => handleFormSuccess('adjuster')}
              onCancel={handleFormCancel}
            />
          ) : ActiveTabComponent ? (
            <ActiveTabComponent 
              lead={lead} 
              leadId={lead.id}
              {...(ActiveTabComponent === LeadOverviewTab && {
                onEditRequest: (section: EditableSection) => setFormToEdit(section),
              })}
            />
          ) : (
            <p>Something went wrong. Tab content cannot be displayed.</p>
          )}
        </CardContent>
      </Card>
    </Tabs>
  )
} 