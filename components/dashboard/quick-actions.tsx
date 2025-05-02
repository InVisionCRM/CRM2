"use client"

import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileCheck, Plus, Trash, FileUp, FileText, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { FilesSheet } from "@/components/files/files-sheet"
import { LeadSelectionSheet } from "@/components/files/lead-selection-sheet"
import type { Lead } from "@/types/lead"

interface QuickActionProps {
  icon: React.ReactNode | null
  label: string
  description?: string
  onClick: () => void
  isPrimary?: boolean
  className?: string
  imageUrl?: string
  blurAmount?: string
}

function QuickAction({
  icon,
  label,
  description,
  onClick,
  isPrimary = false,
  className,
  imageUrl,
  blurAmount,
}: QuickActionProps) {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    setIsClicked(true)
    setTimeout(() => {
      setIsClicked(false)
      onClick()
    }, 300) // Match this with the animation duration
  }

  return (
    <Button
      variant={isPrimary ? "default" : "outline"}
      className={cn(
        "flex-col h-full py-4 px-4",
        "w-full text-center items-center justify-center gap-2",
        "rounded-xl border",
        "text-white", // Added text-white to ensure all text is white
        "transition-all duration-300 ease-in-out", // Base transition for all effects
        "hover:scale-[1.03] hover:shadow-lg", // Expand on hover
        isClicked && "animate-quick-zoom", // Apply zoom animation on click
        isPrimary && !imageUrl
          ? "bg-gradient-to-br from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
          : !imageUrl && "hover:bg-gray-50 dark:hover:bg-gray-800",
        imageUrl ? "relative overflow-hidden" : "",
        className,
      )}
      onClick={handleClick}
    >
      {imageUrl && (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt=""
            className={cn("w-full h-full object-cover", blurAmount ? `blur-${blurAmount}` : "")}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      {icon && (
        <div
          className={cn(
            "p-2 rounded-lg relative z-10",
            "bg-white/20 text-white", // Changed to always use white text for icons
          )}
        >
          {icon}
        </div>
      )}
      <div className="relative z-10">
        <div className="font-medium mb-1 text-2xl text-white">{label}</div> {/* Added text-white */}
        {description && (
          <p className="text-sm text-white/90">{description}</p> // Changed to always use white text with 90% opacity
        )}
      </div>
    </Button>
  )
}

function ContractTypeSelector({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()

  const handleContractTypeSelect = (type: string) => {
    onClose()
    if (type === "general") {
      router.push("/contracts/general") // Changed back to the correct path
    } else if (type === "scope") {
      router.push("/contracts/scope-of-work")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Contract Type</DialogTitle>
          <DialogDescription>Choose the type of contract you want to create</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            onClick={() => handleContractTypeSelect("general")}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <FileText className="h-8 w-8" />
            <span className="text-lg font-medium">General Contract</span>
          </Button>
          <Button
            onClick={() => handleContractTypeSelect("scope")}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <ClipboardList className="h-8 w-8" />
            <span className="text-lg font-medium">Scope of Work</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InvoiceForm() {
  const [lineItems, setLineItems] = useState([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }])

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0, amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client">Client</Label>
          <Input id="client" placeholder="Client name" />
        </div>
        <div>
          <Label htmlFor="invoice-number">Invoice #</Label>
          <Input id="invoice-number" placeholder="INV-001" />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
        </div>
        <div>
          <Label htmlFor="due-date">Due Date</Label>
          <Input id="due-date" type="date" />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" placeholder="Client address" className="h-20" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Line Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="h-8 px-2 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium">
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">Amount</div>
            <div className="col-span-1"></div>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 p-2 border-t items-center">
              <div className="col-span-6">
                <Input
                  placeholder="Description"
                  className="h-8 text-xs"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...lineItems]
                    newItems[index].description = e.target.value
                    setLineItems(newItems)
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...lineItems]
                    newItems[index].quantity = Number.parseInt(e.target.value) || 0
                    newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice
                    setLineItems(newItems)
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const newItems = [...lineItems]
                    newItems[index].unitPrice = Number.parseFloat(e.target.value) || 0
                    newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice
                    setLineItems(newItems)
                  }}
                />
              </div>
              <div className="col-span-1 text-xs">${(item.quantity * item.unitPrice).toFixed(2)}</div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                  className="h-6 w-6 p-0"
                  disabled={lineItems.length === 1}
                >
                  <Trash className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-12 gap-2 p-2 border-t bg-muted/30">
            <div className="col-span-10 text-right font-medium">Total:</div>
            <div className="col-span-2 font-bold">${calculateTotal().toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Additional notes..." className="h-20" />
      </div>
    </div>
  )
}

export function QuickActions() {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [filesSheetOpen, setFilesSheetOpen] = useState(false)
  const [leadSelectionOpen, setLeadSelectionOpen] = useState(false)
  const [contractSelectorOpen, setContractSelectorOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined)
  const router = useRouter()

  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`)
    // Implement actions accordingly
    if (action === "quick-links") {
      router.push("/quick-links")
    } else if (action === "invoice") {
      setInvoiceDialogOpen(true)
    } else if (action === "team") {
      router.push("/team-performance")
    } else if (action === "purlin-vision") {
      router.push("/map")
    } else if (action === "file-upload") {
      // Open the lead selection sheet first
      setLeadSelectionOpen(true)
    } else if (action === "contract") {
      // Open the contract type selector
      setContractSelectorOpen(true)
    }
  }

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadSelectionOpen(false)
    setFilesSheetOpen(true)
  }

  const handleFilesSheetClose = () => {
    setFilesSheetOpen(false)
    // Reset selected lead when files sheet is closed
    setSelectedLead(undefined)
  }

  return (
    <>
      <style jsx global>{`
        @keyframes quickZoom {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .animate-quick-zoom {
          animation: quickZoom 0.3s ease-in-out;
        }
      `}</style>
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-fr">
            {/* Purlin-Vision - Large 2x2 tile spanning 4 columns on md+ screens */}
            <QuickAction
              icon={null}
              label="Purlin-Vision"
              description="Map-based lead creation"
              onClick={() => handleAction("purlin-vision")}
              imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Screenshot%202025-04-21%20at%2011.20.34%E2%80%AFAM-AtE0adjEctfQKxvUQsj3mL2NZtkzAt.png"
              blurAmount="sm"
              className="col-span-2 row-span-2 md:col-span-2 border-2 border-lime-500 text-white font-medium"
            />

            {/* File Upload - Medium tile */}
            <QuickAction
              icon={<FileUp className="h-5 w-5" />}
              label="File Upload"
              description="Upload documents"
              onClick={() => handleAction("file-upload")}
              imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/dashboard-images/file-upload.png"
              blurAmount="sm"
              className="col-span-2 md:col-span-2 border-2 border-lime-500"
            />

            {/* Contract - Small tile with image background */}
            <QuickAction
              icon={<FileCheck className="h-5 w-5" />}
              label="Contract"
              description="Generate contract"
              onClick={() => handleAction("contract")}
              imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/dashboard-images/contracts.png"
              blurAmount="sm"
              className="col-span-2 md:col-span-2 border-2 border-lime-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Fill out the form below to create a new invoice.</DialogDescription>
          </DialogHeader>

          <InvoiceForm />

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Save Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Type Selector */}
      <ContractTypeSelector isOpen={contractSelectorOpen} onClose={() => setContractSelectorOpen(false)} />

      {/* Lead Selection Sheet */}
      <LeadSelectionSheet
        isOpen={leadSelectionOpen}
        onClose={() => setLeadSelectionOpen(false)}
        onLeadSelect={handleLeadSelect}
      />

      {/* Files Sheet */}
      <FilesSheet
        isOpen={filesSheetOpen}
        onClose={handleFilesSheetClose}
        files={[]}
        leadId="dashboard"
        selectedLead={selectedLead}
      />
    </>
  )
}
