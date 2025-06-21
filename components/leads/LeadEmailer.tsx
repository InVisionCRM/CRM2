"use client";

import { useState } from "react";
import { Lead } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Mail, Loader2 } from "lucide-react";

interface LeadEmailerProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: "intro",
    name: "Introduction",
    subject: "Hello {{firstName}} – quick intro",
    body: "Hi {{firstName}},\n\nThank you for taking the time to speak with me about your roofing needs. I'll drop by {{address}} at {{appointmentDate}}.\n\nBest,\n{{salesRep}}",
  },
  {
    id: "acv-reminder",
    name: "ACV Check Reminder",
    subject: "ACV pick-up reminder",
    body: "Hi {{firstName}},\n\nJust a reminder that I'll stop by to collect the ACV check this week. Let me know if another time works better.\n\nThanks,\n{{salesRep}}",
  },
  {
    id: "thank-you",
    name: "Thank You + Referral",
    subject: "Thank you {{firstName}}!",
    body: "Hi {{firstName}},\n\nIt was a pleasure completing your project. If you know anyone who could benefit from our services, please share my info.\n\nHave a great day!\n{{salesRep}}",
  },
];

function merge(template: string, lead: Lead): string {
  return template
    .replace(/{{firstName}}/g, lead.firstName || "")
    .replace(/{{lastName}}/g, lead.lastName || "")
    .replace(/{{address}}/g, lead.address || "")
    .replace(/{{salesRep}}/g, (lead as any).ownerName || (lead as any).salesRepName || "")
    // appointmentDate placeholder left blank – could be enhanced
    ;
}

export function LeadEmailer({ lead, open, onOpenChange }: LeadEmailerProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [subject, setSubject] = useState<string>(() => merge(TEMPLATES[0].subject, lead));
  const [body, setBody] = useState<string>(() => merge(TEMPLATES[0].body, lead));
  const [isSending, setIsSending] = useState(false);

  const handleTemplateChange = (value: string) => {
    const tpl = TEMPLATES.find((t) => t.id === value)!;
    setSelectedTemplateId(value);
    setSubject(merge(tpl.subject, lead));
    setBody(merge(tpl.body, lead));
  };

  const handleSend = async () => {
    if (!lead.email) {
      toast({ title: "Lead has no email", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: lead.email, subject, text: body }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email");
      }
      toast({ title: "Email sent!", description: `Message sent to ${lead.email}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Send Email to {lead.firstName}
          </DialogTitle>
          <DialogDescription>Compose and send a Gmail message</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>

          <div className="space-y-2">
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSend} disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 