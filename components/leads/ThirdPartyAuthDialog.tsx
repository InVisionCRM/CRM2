import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const ThirdPartyAuthSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  mortgageCompany: z.string().min(1, "Required"),
  loanNumber: z.string().min(1, "Required"),
  insuranceCompany: z.string().min(1, "Required"),
  claimNumber: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
});

type ThirdPartyAuthForm = z.infer<typeof ThirdPartyAuthSchema>;

type ThirdPartyAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Partial<ThirdPartyAuthForm> & { email: string };
  onSuccess?: () => void;
};

const fieldLabels: Record<keyof ThirdPartyAuthForm, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  phone: "Phone",
  address: "Address",
  mortgageCompany: "Mortgage Company",
  loanNumber: "Loan Number",
  insuranceCompany: "Insurance Company",
  claimNumber: "Claim Number",
  email: "Email",
};

const ThirdPartyAuthDialog: React.FC<ThirdPartyAuthDialogProps> = ({ open, onOpenChange, lead, onSuccess }) => {
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ThirdPartyAuthForm>({
    resolver: zodResolver(ThirdPartyAuthSchema),
    defaultValues: {
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      phone: lead.phone || "",
      address: lead.address || "",
      mortgageCompany: "",
      loanNumber: "",
      insuranceCompany: lead.insuranceCompany || "",
      claimNumber: lead.claimNumber || "",
      email: lead.email || "",
    },
    mode: "onChange",
  });

  const { handleSubmit, register, formState, getValues } = form;
  const { errors, isValid } = formState;

  const onSubmit = (data: ThirdPartyAuthForm) => {
    setError(null);
    setStep("confirm");
  };

  const onConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const values = getValues();
      const res = await fetch("/api/docuseal/3rd_party_auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send contract");
      setStep("success");
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => setStep("form");
  const onClose = () => {
    setStep("form");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>3rd Party Authorization Contract</DialogTitle>
        </DialogHeader>
        {step === "form" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {Object.entries(fieldLabels).map(([field, label]) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="font-medium text-sm" htmlFor={field}>{label}</label>
                <Input
                  id={field}
                  {...register(field as keyof ThirdPartyAuthForm)}
                  type={field === "email" ? "email" : "text"}
                  autoComplete="off"
                  className={errors[field as keyof ThirdPartyAuthForm] ? "border-red-500" : ""}
                />
                {errors[field as keyof ThirdPartyAuthForm] && (
                  <span className="text-xs text-red-500">{errors[field as keyof ThirdPartyAuthForm]?.message as string}</span>
                )}
              </div>
            ))}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={!isValid}>Send to client to sign</Button>
            </DialogFooter>
          </form>
        )}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="text-base font-semibold">Confirm the following information before sending:</div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(fieldLabels).map(([field, label]) => (
                <div key={field} className="flex flex-col gap-0.5 p-2 rounded bg-slate-100/80">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{getValues()[field as keyof ThirdPartyAuthForm]}</span>
                </div>
              ))}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onBack}>Go back and edit</Button>
              <Button type="button" onClick={onConfirm} loading={loading} disabled={loading}>
                {loading ? "Sending..." : "Proceed and send to client"}
              </Button>
            </DialogFooter>
          </div>
        )}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="text-green-600 text-2xl font-bold">Contract sent!</div>
            <Button onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ThirdPartyAuthDialog; 