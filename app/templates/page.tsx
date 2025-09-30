"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Mail, MessageSquare, User, Search, FileText, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

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
  dateOfLoss: string | null
}

interface Template {
  id: string
  name: string
  description: string
  emailSubject: string
  emailBody: string
  textMessage: string
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

const replaceTemplateVariables = (template: string, lead: Lead | null, userName: string): string => {
  if (!lead) return template
  
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

export default function TemplatesPage() {
  const { data: session } = useSession()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedClient, setSelectedClient] = useState<Lead | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const userName = session?.user?.name || 'Your Representative'

  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/leads')
        if (response.ok) {
          const data = await response.json()
          setLeads(data)
        } else {
          console.error('Failed to fetch leads')
        }
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    const template = leadStatusTemplates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
  }

  const handleClientSelect = (clientId: string) => {
    const client = leads.find(lead => lead.id === clientId)
    setSelectedClient(client || null)
    setSearchTerm("")
    setIsSearchOpen(false)
  }

  const getPreviewContent = (content: string) => {
    return replaceTemplateVariables(content, selectedClient, userName)
  }

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => {
    const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim().toLowerCase()
    const address = (lead.address || '').toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return fullName.includes(searchLower) || address.includes(searchLower)
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsSearchOpen(true)
  }

  const handleSearchFocus = () => {
    setIsSearchOpen(true)
  }

  const handleSearchBlur = () => {
    // Delay closing to allow for clicks
    setTimeout(() => setIsSearchOpen(false), 150)
  }

  const handleSendEmail = async () => {
    if (!selectedClient || !selectedTemplate) {
      toast.error("Please select both a client and template")
      return
    }

    if (!selectedClient.email) {
      toast.error("Selected client has no email address")
      return
    }

    setIsSendingEmail(true)
    try {
      const emailSubject = getPreviewContent(selectedTemplate.emailSubject)
      const emailBody = getPreviewContent(selectedTemplate.emailBody)

      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: selectedClient.email,
          subject: emailSubject,
          text: emailBody,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      toast.success(`Email sent successfully to ${selectedClient.email}!`)
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send email")
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full mr-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Email & Text Templates</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional communication templates for In-Vision Construction lead management
          </p>
          <div className="flex items-center justify-center mt-4">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              {leadStatusTemplates.length} Templates Available
            </Badge>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Client Selection */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <User className="h-5 w-5" />
                </div>
                Select Client
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Input with Live Results */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-300" />
                  <Input
                    placeholder="Search clients by name or address..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-lg bg-gray-900/90 text-white placeholder:text-white"
                  />
                  
                  {/* Live Search Results */}
                  {isSearchOpen && searchTerm && (
                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => handleClientSelect(lead.id)}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-semibold text-gray-900">
                              {`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Client'}
                              {!lead.email && <span className="text-yellow-600 ml-2">⚠️</span>}
                            </div>
                            {lead.address && (
                              <div className="text-sm text-gray-700 font-medium">{lead.address}</div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs text-blue-700 font-medium">
                                Status: {lead.status.replace('_', ' ').toUpperCase()}
                              </div>
                              {lead.email && (
                                <div className="text-xs text-green-700 font-medium">
                                  📧 Email available
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-gray-700 text-center font-medium">
                          No clients found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Selected Client Info */}
                {selectedClient && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-full">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {`${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() || 'Unnamed Client'}
                        </p>
                        {selectedClient.address && (
                          <p className="text-sm text-gray-800 font-medium">{selectedClient.address}</p>
                        )}
                        <Badge variant="outline" className="mt-1 text-xs border-gray-600 text-gray-800 font-medium">
                          {selectedClient.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <MessageSquare className="h-5 w-5" />
                </div>
                Select Template
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 focus:border-green-500 rounded-lg bg-gray-900/90 text-white">
                  <SelectValue placeholder="Choose a template type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 max-h-80 overflow-y-auto">
                  {leadStatusTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="py-3 bg-white hover:bg-gray-50 focus:bg-gray-50">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{template.name}</span>
                        <span className="text-sm text-gray-900/70 font-medium">{template.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedTemplate && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mt-4 border-l-4 border-green-500">
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
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Mail className="h-6 w-6" />
              </div>
              Live Preview
            </CardTitle>
            {selectedClient && (
              <div className="mt-2 space-y-1">
                <p className="text-purple-100">
                  Previewing for: {`${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() || 'Unnamed Client'}
                </p>
                {selectedClient.email && (
                  <p className="text-purple-200 text-sm">
                    📧 {selectedClient.email}
                  </p>
                )}
                {!selectedClient.email && (
                  <p className="text-yellow-200 text-sm">
                    ⚠️ No email address on file
                  </p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-8">
            {selectedTemplate ? (
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
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-l-4 border-blue-500">
                          <p className="font-medium text-gray-900">{getPreviewContent(selectedTemplate.emailSubject)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Email Body
                        </label>
                        <div className="p-6 bg-gray-50 rounded-lg border max-h-96 overflow-y-auto">
                          <pre className="text-sm whitespace-pre-wrap text-gray-900 font-sans leading-relaxed">
                            {getPreviewContent(selectedTemplate.emailBody)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => copyToClipboard(getPreviewContent(selectedTemplate.emailBody))}
                        variant="outline"
                        className="flex-1 h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        Copy Email
                      </Button>
                      <Button 
                        onClick={handleSendEmail}
                        disabled={isSendingEmail || !selectedClient?.email}
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
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Template</h3>
                <p className="text-gray-700 mb-4 font-medium">Choose a template above to see the live preview</p>
                {!selectedClient ? (
                  <p className="text-sm text-gray-600 font-medium">
                    💡 Select a client first to see personalized content
                  </p>
                ) : !selectedTemplate ? (
                  <p className="text-sm text-gray-600 font-medium">
                    📧 Select a template to preview and send emails directly
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

 