"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { StatusGrid } from "@/components/status-grid"
import { LeadsList } from "@/components/leads-list"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCreateLead } from "@/hooks/use-create-lead"
import { LeadStatus } from "@prisma/client"

const leadFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  status: z.string(),
})

type LeadFormValues = z.infer<typeof leadFormSchema>

interface LeadsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function LeadsDrawer({ isOpen, onClose }: LeadsDrawerProps) {
  const { toast } = useToast()
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null)
  const [showLeadsList, setShowLeadsList] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { createLead, isLoading } = useCreateLead()

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      status: "new",
    },
  })

  const handleStatusClick = (status: LeadStatus | null) => {
    setSelectedStatus(status)
    setShowLeadsList(true)
    setShowCreateForm(false)
  }

  const handleBackToStatuses = () => {
    setShowLeadsList(false)
    setShowCreateForm(false)
  }

  const handleShowCreateForm = () => {
    setShowCreateForm(true)
    setShowLeadsList(false)
  }

  const onSubmit = async (values: LeadFormValues) => {
    try {
      await createLead(values)
      toast({
        title: "Success",
        description: "Lead created successfully",
      })
      form.reset()
      setShowCreateForm(false)
      setShowLeadsList(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive",
      })
    }
  }

  const getTitle = () => {
    if (showCreateForm) return "Create New Lead"
    if (showLeadsList) return formatStatusLabel(selectedStatus)
    return "Leads"
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DrawerTitle>{getTitle()}</DrawerTitle>
            <div className="flex items-center">
              {(showLeadsList || showCreateForm) && (
                <Button variant="ghost" size="sm" onClick={handleBackToStatuses} className="mr-2">
                  Back
                </Button>
              )}
              {!showCreateForm && !showLeadsList && (
                <Button variant="outline" size="sm" onClick={handleShowCreateForm} className="mr-2">
                  <Plus className="h-4 w-4 mr-1" />
                  New Lead
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto">
          {showCreateForm ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="closed_won">Closed Won</SelectItem>
                          <SelectItem value="closed_lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Lead"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : showLeadsList ? (
            <LeadsList leads={[]} assignedTo={null} />
          ) : (
            <StatusGrid onStatusClick={handleStatusClick} activeStatus={selectedStatus} statusCounts={[]} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function formatStatusLabel(status: string | null): string {
  if (!status) return "All Leads"

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
