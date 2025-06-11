"use client"

import { useState } from "react";
import type { Lead } from "@prisma/client"
import { ContactForm } from "@/components/forms/ContactForm"
import { InsuranceForm } from "@/components/forms/InsuranceForm"
import { AdjusterForm } from "@/components/forms/AdjusterForm"
import { LeadOverviewTab } from "./tabs/LeadOverviewTab"
import { Card, CardContent } from "@/components/ui/card"
import { useSWRConfig } from "swr"

interface LeadDetailTabsProps {
  lead: Lead | null;
  activeTab: string;
  onTabChange: (value: string) => void;
}

// Define type for the section being edited
type EditableSection = 'contact' | 'insurance' | 'adjuster' | null;

export function LeadDetailTabs({ lead, activeTab, onTabChange }: LeadDetailTabsProps) {
  const [formToEdit, setFormToEdit] = useState<EditableSection>(null);
  const { mutate } = useSWRConfig();

  if (!lead) {
    return (
      <Card className="w-full">
        <CardContent className="p-5">
          <div className="h-10 bg-muted rounded w-1/2 mb-4 animate-pulse"></div>
          <div className="h-40 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const getInitialDataForForm = (formType: EditableSection) => {
    if (!lead) return {};
    
    switch (formType) {
      case 'contact':
        return {
          firstName: lead.firstName ?? "",
          lastName: lead.lastName ?? "",
          email: lead.email ?? "",
          phone: lead.phone ?? "",
          address: lead.address ?? "",
        };
      case 'insurance':
        return {
          insuranceCompany: lead.insuranceCompany ?? "",
          insurancePolicyNumber: lead.insurancePolicyNumber ?? "",
          insurancePhone: lead.insurancePhone ?? "",
          insuranceDeductible: lead.insuranceDeductible ?? "",
          insuranceSecondaryPhone: lead.insuranceSecondaryPhone ?? "",
          dateOfLoss: lead.dateOfLoss ? new Date(lead.dateOfLoss).toISOString().split('T')[0] : "",
          damageType: lead.damageType as any ?? undefined,
          claimNumber: lead.claimNumber ?? "",
        };
      case 'adjuster':
        return {
          insuranceAdjusterName: lead.insuranceAdjusterName ?? "",
          insuranceAdjusterPhone: lead.insuranceAdjusterPhone ?? "",
          insuranceAdjusterEmail: lead.insuranceAdjusterEmail ?? "",
          adjusterAppointmentDate: lead.adjusterAppointmentDate 
            ? new Date(lead.adjusterAppointmentDate).toISOString().split('T')[0]
            : "",
          adjusterAppointmentTime: lead.adjusterAppointmentTime ?? "",
          adjusterAppointmentNotes: lead.adjusterAppointmentNotes ?? "",
        };
      default:
        return {};
    }
  };

  const handleFormSuccess = async (formType: EditableSection) => {
    console.log(`${formType} form submitted successfully`);
    setFormToEdit(null);
    
    // Revalidate the lead data
    await mutate(`/api/leads/${lead.id}`);
  };

  const handleFormCancel = () => {
    setFormToEdit(null);
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-4 sm:p-6 min-h-[400px] bg-transparent">
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
        ) : (
          <LeadOverviewTab 
            lead={lead} 
            leadId={lead.id}
            onEditRequest={(section: EditableSection) => setFormToEdit(section)}
          />
        )}
      </CardContent>
    </Card>
  )
} 