import { useState } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Mail, MessageSquare, Send, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: string
  insuranceCompany: string | null
  insurancePolicyNumber: string | null
  insurancePhone: string | null
  insuranceAdjusterName: string | null
  insuranceAdjusterPhone: string | null
  insuranceAdjusterEmail: string | null
  insuranceDeductible: string | null
  claimNumber: string | null
  damageType: string | null
  dateOfLoss: string | Date | null
}

interface Template {
  id: string
  name: string
  description: string
  emailSubject: string
  emailBody: string
  textMessage: string
}

interface LeadTemplateEmailerProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MISSION_STATEMENT = `

Our Mission
We are committed to providing top-quality solutions with a focus on exceptional customer service and lasting craftsmanship. Our goal is to create a memorable experience for every customer, ensuring their homes are protected and their expectations are exceeded. We believe in fostering a positive, fulfilling environment for our employees, empowering them to deliver the highest standards of work with integrity and care. Through dedication, excellence, and genuine care, we strive to leave a lasting, positive impact on both our customers and our team.`

// Lead Status Templates for all statuses
const leadStatusTemplates: Template[] = [
  {
    id: "follow_ups",
    name: "Follow Ups",
    description: "Following up on initial contact and scheduling next steps",
    emailSubject: "Follow Up - {CLIENT_NAME} Roof Assessment",
    emailBody: `Dear {CLIENT_NAME},

I hope this message finds you well. I'm following up on our previous conversation regarding the roof assessment for your property at {CLIENT_ADDRESS}.

We're here to help guide you through the process and provide you with honest, reliable service.

Next Steps:
• Schedule a free roof inspection
• Review damage assessment with you
• Assist with insurance claim documentation if needed
• Provide a detailed estimate for repairs

We can typically schedule inspections within 24-48 hours. Please let us know a convenient time for you.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}, this is {USER_NAME} from {COMPANY_NAME} following up on your roof assessment. We can schedule a free inspection within 24-48 hours. When would be convenient for you? Visit {WEBSITE} for more info. Thanks!"
  },
  {
    id: "signed_contract",
    name: "Signed Contract",
    description: "Confirmation and next steps after contract signing",
    emailSubject: "Contract Confirmed - {CLIENT_NAME} Roofing Project",
    emailBody: `Dear {CLIENT_NAME},

Thank you for choosing {COMPANY_NAME} for your roofing project! We're excited to work with you.

Contract Details:
• Project Address: {CLIENT_ADDRESS}
• Insurance Company: {INSURANCE_COMPANY}
• Claim Number: {CLAIM_NUMBER}
• Deductible: {DEDUCTIBLE}

What Happens Next:
1. Our project manager will contact you within 2 business days
2. We'll order materials and schedule delivery
3. Work will begin based on weather conditions
4. You'll receive daily progress updates

Please ensure clear access to your property on scheduled work days.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}! Your contract with {COMPANY_NAME} is confirmed. Our project manager will contact you within 2 days to schedule your roofing work. Thanks for choosing us! - {USER_NAME}"
  },
  {
    id: "scheduled",
    name: "Scheduled",
    description: "Confirming scheduled appointments and next steps",
    emailSubject: "Appointment Scheduled - {CLIENT_NAME}",
    emailBody: `Dear {CLIENT_NAME},

Your appointment has been scheduled! We're looking forward to working with you on your roofing project at {CLIENT_ADDRESS}.

Appointment Details:
• Date: [DATE]
• Time: [TIME]
• Address: {CLIENT_ADDRESS}
• Representative: {USER_NAME}

What to Expect:
• Comprehensive roof assessment
• Discussion of repair options
• Insurance claim assistance if needed
• Written estimate provided

Please ensure someone is available at the property during the scheduled time.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}! Your appointment with {COMPANY_NAME} is scheduled for [DATE] at [TIME] at {CLIENT_ADDRESS}. We'll call 15 minutes before arrival. - {USER_NAME}"
  },
  {
    id: "colors",
    name: "Colors Selection",
    description: "Color selection phase for roofing materials",
    emailSubject: "Color Selection - {CLIENT_NAME} Roofing Project",
    emailBody: `Dear {CLIENT_NAME},

It's time to select the colors for your new roof at {CLIENT_ADDRESS}! This is an exciting step in your roofing project.

Next Steps:
• Review available color options
• Consider your home's exterior and neighborhood
• Make final color selection
• Confirm material specifications

We'll provide you with color samples and help you choose the perfect option that complements your home's style and increases its value.

Please let us know when you'd like to review the color options.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}! Time to select colors for your new roof at {CLIENT_ADDRESS}. We'll bring samples to help you choose the perfect option. When works best for you? - {USER_NAME}, {COMPANY_NAME}"
  },
  {
    id: "acv",
    name: "ACV (Actual Cash Value)",
    description: "ACV payment received from insurance",
    emailSubject: "ACV Payment Received - {CLIENT_NAME}",
    emailBody: `Dear {CLIENT_NAME},

Good news! We've received confirmation that the ACV (Actual Cash Value) payment has been processed for your roofing project at {CLIENT_ADDRESS}.

Payment Details:
• Insurance Company: {INSURANCE_COMPANY}
• Claim Number: {CLAIM_NUMBER}
• ACV Amount: [AMOUNT]

Next Steps:
• Schedule work commencement
• Order materials for your project
• Coordinate with your schedule
• RCV (Replacement Cost Value) will be paid upon completion

We're ready to begin work on your roof. Please let us know your preferred start date.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}! ACV payment received for your roof project at {CLIENT_ADDRESS}. Ready to schedule work start. When works best for you? - {USER_NAME}, {COMPANY_NAME}"
  },
  {
    id: "job",
    name: "Job in Progress",
    description: "Project currently in progress",
    emailSubject: "Project Update - {CLIENT_NAME}",
    emailBody: `Dear {CLIENT_NAME},

I wanted to provide you with an update on your roofing project at {CLIENT_ADDRESS}.

Current Status:
• Work is progressing as scheduled
• Weather conditions are favorable
• Materials are on-site and ready
• Crew is performing quality work

Today's Progress:
• [SPECIFIC WORK COMPLETED]
• [AREAS ADDRESSED]
• [NEXT STEPS]

We'll continue to keep you updated throughout the project. Please don't hesitate to reach out with any questions.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}! Progress update on your roof at {CLIENT_ADDRESS}: [TODAY'S WORK]. Project on schedule. Any questions, just call! - {USER_NAME}, {COMPANY_NAME}"
  },
  {
    id: "completed_jobs",
    name: "Completed Jobs",
    description: "Project completion and next steps",
    emailSubject: "Project Complete - {CLIENT_NAME}",
    emailBody: `Dear {CLIENT_NAME},

Congratulations! Your roofing project at {CLIENT_ADDRESS} has been completed successfully.

Project Summary:
• All work completed to specification
• Quality inspection passed
• Cleanup completed
• Warranty information provided

Final Steps:
• Final walkthrough scheduled
• Insurance paperwork submission
• RCV payment processing
• Warranty registration

Thank you for choosing {COMPANY_NAME}. We're proud of the quality work completed on your home.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}! Your roofing project at {CLIENT_ADDRESS} is complete! Final walkthrough scheduled. Thank you for choosing {COMPANY_NAME}! - {USER_NAME}"
  },
  {
    id: "zero_balance",
    name: "Zero Balance",
    description: "All payments completed and account settled",
    emailSubject: "Account Settled - {CLIENT_NAME}",
    emailBody: `Dear {CLIENT_NAME},

Great news! Your account has been fully settled and shows a zero balance.

Account Summary:
• Project Address: {CLIENT_ADDRESS}
• All payments received
• Insurance claims processed
• Final paperwork completed

Your roofing project is now complete and fully paid. All warranty information has been provided for your records.

Thank you for choosing {COMPANY_NAME} for your roofing needs. It was a pleasure working with you!

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}! Your account is settled with zero balance. Your roofing project at {CLIENT_ADDRESS} is complete and fully paid. Thank you for choosing {COMPANY_NAME}! - {USER_NAME}"
  },
  {
    id: "denied",
    name: "Denied Claims",
    description: "Insurance claim denied - next steps and options",
    emailSubject: "Insurance Claim Update - {CLIENT_NAME}",
    emailBody: `Dear {CLIENT_NAME},

I'm reaching out regarding your insurance claim for the property at {CLIENT_ADDRESS}.

Claim Status:
• Insurance Company: {INSURANCE_COMPANY}
• Claim Number: {CLAIM_NUMBER}
• Current Status: Under Review/Requires Additional Information

Next Steps:
• Review denial reasons with you
• Discuss appeal options
• Provide additional documentation if needed
• Explore alternative solutions

We're here to help navigate this process and explore all available options. Please call us to discuss the best path forward.

Best regards,
{USER_NAME}
{COMPANY_NAME}
Website: {WEBSITE}${MISSION_STATEMENT}`,
    textMessage: "Hi {CLIENT_NAME}, this is {USER_NAME} from {COMPANY_NAME}. We need to discuss your insurance claim for {CLIENT_ADDRESS}. Please call us to review options. We're here to help! - {USER_NAME}"
  }
]

const replaceTemplateVariables = (template: string, lead: Lead, userName: string): string => {
  return template
    .replace(/\{CLIENT_NAME\}/g, `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Valued Customer')
    .replace(/\{CLIENT_ADDRESS\}/g, lead.address || '[Property Address]')
    .replace(/\{INSURANCE_COMPANY\}/g, lead.insuranceCompany || '[Insurance Company]')
    .replace(/\{CLAIM_NUMBER\}/g, lead.claimNumber || '[Claim Number]')
    .replace(/\{DEDUCTIBLE\}/g, lead.insuranceDeductible || '[Deductible Amount]')
    .replace(/\{USER_NAME\}/g, userName)
    .replace(/\{COMPANY_NAME\}/g, 'In-Vision Construction')
    .replace(/\{WEBSITE\}/g, 'In-VisionConstruction.com')
}

const copyToClipboard = (text: string) => {
  if (typeof window !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!")
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success("Copied to clipboard!")
    })
  } else {
    toast.error("Clipboard not supported")
  }
}

export function LeadTemplateEmailer({ lead, open, onOpenChange }: LeadTemplateEmailerProps) {
  const { data: session } = useSession()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [editedEmailBody, setEditedEmailBody] = useState("")
  const [editedEmailSubject, setEditedEmailSubject] = useState("")

  const userName = session?.user?.name || 'Your Representative'

  const handleTemplateSelect = (templateId: string) => {
    const template = leadStatusTemplates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
    if (template) {
      setEditedEmailSubject(getPreviewContent(template.emailSubject))
      setEditedEmailBody(getPreviewContent(template.emailBody))
    }
  }

  const getPreviewContent = (content: string) => {
    return replaceTemplateVariables(content, lead, userName)
  }

  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template")
      return
    }

    if (!lead.email) {
      toast.error("This lead has no email address")
      return
    }

    if (!editedEmailSubject.trim() || !editedEmailBody.trim()) {
      toast.error("Please fill in both subject and body")
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: lead.email,
          subject: editedEmailSubject,
          text: editedEmailBody,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      toast.success(`Email sent successfully to ${lead.email}!`)
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send email")
    } finally {
      setIsSendingEmail(false)
    }
  }

  const clientName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Client'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg p-6 -m-6 mb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <FileText className="h-6 w-6" />
            </div>
            Email Templates for {clientName}
          </DialogTitle>
          <div className="mt-2 space-y-1">
            <p className="text-purple-100">
              Send professional template emails directly to this lead
            </p>
            {lead.email ? (
              <p className="text-purple-200 text-sm">
                📧 {lead.email}
              </p>
            ) : (
              <p className="text-yellow-200 text-sm">
                ⚠️ No email address on file
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="p-2 bg-green-500/70 rounded-full">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Select Template</h3>
            </div>
            
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="w-full h-12 border-2 text-center justify-center border-blue-600 rounded-lg bg-green-200/80 text-black">
                <SelectValue placeholder="Choose a template type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 max-h-80 overflow-y-auto">
                {leadStatusTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id} className="py-3 bg-white hover:bg-green-200/80 focus:bg-gray-50">
                    <div className="flex flex-col">
                      <span className="font-bold text-md font-poppins text-black">{template.name}</span>
                      <span className="text-md text-gray-900/70 font-medium">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTemplate && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-l-4 border-green-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-full">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedTemplate.name}</p>
                    <p className="text-sm text-gray-800 font-medium">{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          {selectedTemplate && (
            <div className="border rounded-lg p-6 bg-white">
              <div className="space-y-6">
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 rounded-lg p-1">
                    <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md text-black data-[state=active]:text-black">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Template
                    </TabsTrigger>
                    <TabsTrigger value="text" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md text-black data-[state=active]:text-black">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Text Message
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Email Subject
                        </label>
                        <Textarea
                          value={editedEmailSubject}
                          onChange={(e) => setEditedEmailSubject(e.target.value)}
                          placeholder="Enter email subject..."
                          className="min-h-[20px] text-sm font-medium bg-gray-200/50 text-gray-900 border-2 border-gray-900/60 focus:border-green-500 rounded-lg resize-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Email Body
                        </label>
                        <Textarea
                          value={editedEmailBody}
                          onChange={(e) => setEditedEmailBody(e.target.value)}
                          placeholder="Enter email body..."
                          className="min-h-[300px] text-sm text-gray-900 bg-gray-200/50 border-2 border-gray-900/60 focus:border-green-500/30 rounded-lg resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => copyToClipboard(getPreviewContent(selectedTemplate.emailBody))}
                        variant="outline"
                        className="flex-1 h-12 border-1 border-black text-white bg-gray-900/90 hover:bg-blue-50 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        Copy Email
                      </Button>
                      <Button 
                        onClick={handleSendEmail}
                        disabled={isSendingEmail || !lead.email}
                        className="flex-1 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            Send Email
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="space-y-6 mt-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Text Message
                      </label>
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-l-4 border-purple-500">
                        <p className="text-gray-900 leading-relaxed font-medium">{getPreviewContent(selectedTemplate.textMessage)}</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => copyToClipboard(getPreviewContent(selectedTemplate.textMessage))}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      <Copy className="h-5 w-5 mr-2" />
                      Copy Text Message
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {!selectedTemplate && (
            <div className="text-center py-16 border rounded-lg bg-gray-50">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select a Template</h3>
              <p className="text-gray-700 mb-4 font-medium">Choose a template above to see the live preview</p>
              <p className="text-sm text-gray-600 font-medium">
                📧 Templates will be personalized with {clientName}'s information
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 