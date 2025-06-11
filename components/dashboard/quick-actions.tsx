"use client"

import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Plus, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeadSummary } from "@/types/dashboard"

interface QuickActionProps {
  label: string
  value: string
  imageUrl?: string
}

function QuickAction({
  label,
  value,
  imageUrl,
}: QuickActionProps) {
  const router = useRouter()

  const handleClick = () => {
    console.log(`QuickAction clicked: ${value}`)
    if (value === "quick-links") {
      router.push("/quick-links")
    } else if (value === "invoice") {
      // This will be handled by the parent component
    } else if (value === "purlin-vision") {
      router.push("/map")
    } else if (value === "leads") {
      router.push("/leads")
    } else if (value === "contract") {
      window.open('https://contracts.purlin.pro', '_blank')
    }
  }

  return (
    <div className="relative w-full pb-[40.25%]"> {/* 16:9 aspect ratio */}
      <Button
        onClick={handleClick}
        className={cn(
          "absolute inset-0 w-full h-full p-0",
          "overflow-hidden rounded-lg border-2 border-lime-500/30",
          "transition-all duration-300",
          "hover:brightness-110 bg-transparent hover:bg-transparent",
        )}
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <span className="text-lg font-medium text-white text-center">{label}</span>
        </div>
      </Button>
    </div>
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

  return (
    <>
      <div className="w-100%] mx-auto">
        <div className="grid grid-cols-3 gap-1 h-auto bg-transparent p-0">
          <QuickAction
            label="Leads"
            value="leads"
            imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Quick%20Actions/All_Leads-SEk2NEYpt4fARvrhTSLgiBsCi68m7Y.png"
          />

          <QuickAction
            label="Map"
            value="purlin-vision"
            imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Screenshot%202025-04-21%20at%2011.20.34%E2%80%AFAM-AtE0adjEctfQKxvUQsj3mL2NZtkzAt.png"
          />

          <QuickAction
            label="Contracts"
            value="contract"
            imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/dashboard-images/contracts.png"
          />
        </div>
      </div>

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
    </>
  )
}
