"use client";

import { useState } from "react";
import { Lead } from "@prisma/client";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle, CalendarIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface JobCompletionCardProps {
  lead: Lead;
}

export function JobCompletionCard({ lead }: JobCompletionCardProps) {
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // helper to read metadata
  const getSavedDate = (): string | null => {
    const metadata = lead.metadata as Record<string, any> | null;
    return metadata?.importantDates?.jobCompletionDate || null;
  };

  const savedDateText = getSavedDate();
  const formattedDate = savedDateText ? format(parseISO(savedDateText), "MMM d, yyyy") : null;

  const borderClass = savedDateText
    ? parseISO(savedDateText) < new Date()
      ? "border-gray-500 border-2"
      : "border-lime-500 border-2"
    : "border-gray-700";

  const openModal = () => {
    setSelectedDate(savedDateText ? new Date(savedDateText) : undefined);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDate) {
      toast({ title: "Select a date", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const tzOffset = selectedDate.getTimezoneOffset() * 60000;
      const localISO = new Date(selectedDate.getTime() - tzOffset).toISOString().split("T")[0];

      const resp = await fetch(`/api/leads/${lead.id}/important-dates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateType: "jobCompletionDate", date: localISO }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed");
      }
      toast({ title: "Saved", description: format(selectedDate, "MMM d, yyyy") });
      setIsModalOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/leads/${lead.id}/important-dates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateType: "jobCompletionDate" }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed");
      }
      toast({ title: "Date removed" });
      setIsModalOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={openModal}
        className={cn(
          "h-16 p-2 flex flex-col items-center justify-center gap-1 bg-transparent bg-black/60 text-white hover:bg-gray-800/50 disabled:opacity-100",
          borderClass
        )}
        disabled={isSaving || isDeleting}
      >
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-medium leading-tight">Job Completion</span>
        {formattedDate ? (
          <span className="text-xs font-semibold">{formattedDate}</span>
        ) : (
          <span className="text-xs text-lime-400">+Add Date</span>
        )}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" /> Set Job Completion
            </DialogTitle>
            <DialogDescription>Select a date for job completion</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              onSelect={setSelectedDate}
              classNames={{ day_selected: "bg-primary text-primary-foreground" }}
            />

            <div className="flex gap-2 pt-4">
              {savedDateText && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? "Deleting…" : <><Trash2 className="h-4 w-4 mr-1"/>Delete</>}
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving || isDeleting}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving || !selectedDate}>
                {isSaving ? "Saving…" : "Save Date"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 