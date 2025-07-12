"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  Shield, 
  FileText, 
  Calendar,
  Edit,
  Save,
  X,
  Send,
  Eye,
  ExternalLink,
  Download,
  Trash2,
  Building2,
  ChevronRight,
  MessageSquare,
  Activity,
  Briefcase,
  Home,
  Star,
  Zap,
  Target,
  Layers,
  Grid,
  Settings,
  Bell,
  Filter,
  Search,
  Plus,
  Loader2
} from "lucide-react"
import { LeadStatus } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"

const mockLead = {
  id: "1",
  firstName: "John",
  lastName: "Sarah Smith",
  email: "john.smith@email.com",
  phone: "(555) 123-4567",
  address: "1234 Oak Ridge Drive, Detroit, MI 48201",
  status: "scheduled" as LeadStatus,
  insuranceCompany: "State Farm",
  insurancePhone: "(800) 782-8332",
  insuranceEmail: "claims@statefarm.com",
  insuranceAdjusterName: "Jennifer Davis",
  insuranceAdjusterPhone: "(555) 987-6543",
  insuranceAdjusterEmail: "j.davis@statefarm.com",
  claimNumber: "SF-2024-001234",
  damageType: "Wind & Hail",
  dateOfLoss: "2024-01-15",
  lastActivity: "Called client to schedule appointment",
  lastActivityDate: "2024-01-20T10:30:00Z",
  assignedTo: "Mike Johnson"
}

const mockActivities = [
  {
    id: "1",
    type: "phone_call",
    title: "Called client to schedule appointment",
    description: "Discussed available time slots for roof inspection",
    timestamp: "2024-01-20T10:30:00Z",
    user: "Mike Johnson"
  },
  {
    id: "2", 
    type: "file_upload",
    title: "Uploaded inspection photos",
    description: "Added 12 photos from initial roof assessment",
    timestamp: "2024-01-19T14:15:00Z",
    user: "Mike Johnson"
  },
  {
    id: "3",
    type: "status_change",
    title: "Status changed to Scheduled",
    description: "Lead moved from New to Scheduled status",
    timestamp: "2024-01-18T09:00:00Z",
    user: "System"
  }
]

const mockFiles = [
  {
    id: "1",
    name: "inspection_photos.pdf",
    size: "2.4 MB",
    type: "PDF",
    category: "Photos",
    uploadedAt: "2024-01-19T14:15:00Z"
  },
  {
    id: "2",
    name: "estimate_worksheet.xlsx", 
    size: "156 KB",
    type: "Excel",
    category: "Estimates",
    uploadedAt: "2024-01-18T11:30:00Z"
  },
  {
    id: "3",
    name: "claim_documentation.pdf",
    size: "890 KB", 
    type: "PDF",
    category: "Claims",
    uploadedAt: "2024-01-17T16:45:00Z"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "scheduled": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "signed_contract": return "bg-green-500/20 text-green-400 border-green-500/30"
    case "completed_jobs": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "follow_ups": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    case "acv": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "job": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    case "colors": return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
    case "zero_balance": return "bg-green-600/20 text-green-300 border-green-600/30"
    case "denied": return "bg-red-500/20 text-red-400 border-red-500/30"
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }
}

const getStatusColors = (status: string) => {
  switch (status) {
    case "scheduled": return { border: "59, 130, 246", shadow: "59, 130, 246", glow: "rgb(59, 130, 246)" } // blue
    case "signed_contract": return { border: "34, 197, 94", shadow: "34, 197, 94", glow: "rgb(34, 197, 94)" } // green
    case "completed_jobs": return { border: "16, 185, 129", shadow: "16, 185, 129", glow: "rgb(16, 185, 129)" } // emerald
    case "follow_ups": return { border: "245, 158, 11", shadow: "245, 158, 11", glow: "rgb(245, 158, 11)" } // yellow
    case "acv": return { border: "168, 85, 247", shadow: "168, 85, 247", glow: "rgb(168, 85, 247)" } // purple
    case "job": return { border: "249, 115, 22", shadow: "249, 115, 22", glow: "rgb(249, 115, 22)" } // orange
    case "colors": return { border: "99, 102, 241", shadow: "99, 102, 241", glow: "rgb(99, 102, 241)" } // indigo
    case "zero_balance": return { border: "34, 197, 94", shadow: "34, 197, 94", glow: "rgb(34, 197, 94)" } // green
    case "denied": return { border: "239, 68, 68", shadow: "239, 68, 68", glow: "rgb(239, 68, 68)" } // red
    default: return { border: "107, 114, 128", shadow: "107, 114, 128", glow: "rgb(107, 114, 128)" } // gray
  }
}

const formatStatusLabel = (status: string): string => {
  switch (status) {
    case "signed_contract": return "Signed Contract"
    case "scheduled": return "Scheduled"
    case "colors": return "Colors"
    case "acv": return "ACV"
    case "job": return "Job"
    case "completed_jobs": return "Completed Jobs"
    case "zero_balance": return "Zero Balance"
    case "denied": return "Denied"
    case "follow_ups": return "Follow Ups"
    default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}

const getDropdownItemColor = (status: string) => {
  switch (status) {
    case "scheduled": return "text-blue-400 hover:bg-blue-500/10"
    case "signed_contract": return "text-green-400 hover:bg-green-500/10"
    case "completed_jobs": return "text-emerald-400 hover:bg-emerald-500/10"
    case "follow_ups": return "text-yellow-400 hover:bg-yellow-500/10"
    case "acv": return "text-purple-400 hover:bg-purple-500/10"
    case "job": return "text-orange-400 hover:bg-orange-500/10"
    case "colors": return "text-indigo-400 hover:bg-indigo-500/10"
    case "zero_balance": return "text-green-300 hover:bg-green-600/10"
    case "denied": return "text-red-400 hover:bg-red-500/10"
    default: return "text-gray-400 hover:bg-gray-500/10"
  }
}

// Enhanced Neon Lead Card with status-based neon and status change
function NeonLeadCard({ title, className = "" }: { title: string, className?: string }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [noteText, setNoteText] = useState("")
  const [editingInsurance, setEditingInsurance] = useState(false)
  const [editingAdjuster, setEditingAdjuster] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(mockLead.status)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const { toast } = useToast()

  // Mock status change function that works with local state
  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update local state
      setCurrentStatus(newStatus)
      
      // Show success toast
      toast({
        title: "Status Updated",
        description: `Lead status changed to ${formatStatusLabel(newStatus)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const colors = getStatusColors(currentStatus)

  return (
    <Card 
      className={`bg-slate-900/50 border-slate-700/50 backdrop-blur-sm ${className} transition-all duration-1000 ease-in-out w-full max-w-4xl`}
      style={{
        borderColor: `rgba(${colors.border}, 0.8)`,
        boxShadow: `
          0 0 20px rgba(${colors.shadow}, 0.3),
          0 0 40px rgba(${colors.shadow}, 0.2),
          0 0 60px rgba(${colors.shadow}, 0.1),
          0 10px 15px -3px rgba(${colors.shadow}, 0.2), 
          0 4px 6px -2px rgba(${colors.shadow}, 0.1),
          inset 0 1px 0 rgba(${colors.shadow}, 0.1)
        `,
        background: `linear-gradient(135deg, 
          rgba(${colors.shadow}, 0.05) 0%, 
          rgba(15, 23, 42, 0.8) 30%, 
          rgba(15, 23, 42, 0.9) 70%, 
          rgba(${colors.shadow}, 0.05) 100%)`,
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
          {title}
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{
              backgroundColor: colors.glow,
              boxShadow: `0 0 10px ${colors.glow}, 0 0 20px ${colors.glow}`,
            }}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lead Header with Status Change */}
        <div 
          className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 transition-all duration-1000 ease-in-out"
          style={{
            borderColor: `rgba(${colors.border}, 0.3)`,
            boxShadow: `0 0 15px rgba(${colors.shadow}, 0.1)`,
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar 
              className="h-10 w-10 bg-slate-700 border-2 transition-all duration-1000 ease-in-out flex-shrink-0"
              style={{
                borderColor: `rgba(${colors.border}, 0.5)`,
                boxShadow: `0 0 10px rgba(${colors.shadow}, 0.2)`,
              }}
            >
              <AvatarFallback className="text-slate-300 bg-slate-700">JS</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-200 truncate">{mockLead.firstName} {mockLead.lastName}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{mockLead.address}</span>
              </p>
            </div>
          </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                    <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                                    <SelectTrigger 
                        className="w-[180px] h-[40px] bg-slate-800/50 text-slate-200 transition-all duration-300 border-0"
                        style={{
                          boxShadow: `0 0 5px rgba(${colors.shadow}, 0.1)`,
                        }}
                      >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_ups" className="p-0">
                  <Badge className={`${getStatusColor("follow_ups")} border min-w-[120px] justify-center`}>
                    Follow Ups
                  </Badge>
                </SelectItem>
                <SelectItem value="scheduled" className="p-0">
                  <Badge className={`${getStatusColor("scheduled")} border min-w-[120px] justify-center`}>
                    Scheduled
                  </Badge>
                </SelectItem>
                <SelectItem value="colors" className="p-0">
                  <Badge className={`${getStatusColor("colors")} border min-w-[120px] justify-center`}>
                    Colors
                  </Badge>
                </SelectItem>
                <SelectItem value="acv" className="p-0">
                  <Badge className={`${getStatusColor("acv")} border min-w-[120px] justify-center`}>
                    ACV
                  </Badge>
                </SelectItem>
                <SelectItem value="signed_contract" className="p-0">
                  <Badge className={`${getStatusColor("signed_contract")} border min-w-[120px] justify-center`}>
                    Signed Contract
                  </Badge>
                </SelectItem>
                <SelectItem value="job" className="p-0">
                  <Badge className={`${getStatusColor("job")} border min-w-[120px] justify-center`}>
                    Job
                  </Badge>
                </SelectItem>
                <SelectItem value="completed_jobs" className="p-0">
                  <Badge className={`${getStatusColor("completed_jobs")} border min-w-[120px] justify-center`}>
                    Completed Jobs
                  </Badge>
                </SelectItem>
                <SelectItem value="zero_balance" className="p-0">
                  <Badge className={`${getStatusColor("zero_balance")} border min-w-[120px] justify-center`}>
                    Zero Balance
                  </Badge>
                </SelectItem>
                <SelectItem value="denied" className="p-0">
                  <Badge className={`${getStatusColor("denied")} border min-w-[120px] justify-center`}>
                    Denied
                  </Badge>
                </SelectItem>
              </SelectContent>
            </Select>
            {isUpdatingStatus && (
              <Loader2 
                className="h-4 w-4 animate-spin transition-all duration-1000 ease-in-out" 
                style={{ color: colors.glow }}
              />
            )}
          </div>
        </div>



        {/* Tabs with Enhanced Neon */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList 
            className="grid w-full grid-cols-6 bg-slate-800/50 border transition-all duration-1000 ease-in-out"
            style={{
              borderColor: `rgba(${colors.border}, 0.3)`,
              boxShadow: `0 0 10px rgba(${colors.shadow}, 0.1)`,
            }}
          >
                         <TabsTrigger 
               value="overview" 
               className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg"
               style={{
                 backgroundColor: activeTab === 'overview' ? `rgba(${colors.shadow}, 0.3)` : 'transparent',
                 color: activeTab === 'overview' ? colors.glow : 'inherit',
                 boxShadow: activeTab === 'overview' ? `0 0 10px rgba(${colors.shadow}, 0.3)` : 'none',
               }}
             >
               Overview
             </TabsTrigger>
                         <TabsTrigger 
               value="insurance" 
               className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg"
               style={{
                 backgroundColor: activeTab === 'insurance' ? `rgba(${colors.shadow}, 0.3)` : 'transparent',
                 color: activeTab === 'insurance' ? colors.glow : 'inherit',
                 boxShadow: activeTab === 'insurance' ? `0 0 10px rgba(${colors.shadow}, 0.3)` : 'none',
               }}
             >
               Insurance
             </TabsTrigger>
             <TabsTrigger 
               value="adjuster" 
               className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg"
               style={{
                 backgroundColor: activeTab === 'adjuster' ? `rgba(${colors.shadow}, 0.3)` : 'transparent',
                 color: activeTab === 'adjuster' ? colors.glow : 'inherit',
                 boxShadow: activeTab === 'adjuster' ? `0 0 10px rgba(${colors.shadow}, 0.3)` : 'none',
               }}
             >
               Adjuster
             </TabsTrigger>
             <TabsTrigger 
               value="files" 
               className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg"
               style={{
                 backgroundColor: activeTab === 'files' ? `rgba(${colors.shadow}, 0.3)` : 'transparent',
                 color: activeTab === 'files' ? colors.glow : 'inherit',
                 boxShadow: activeTab === 'files' ? `0 0 10px rgba(${colors.shadow}, 0.3)` : 'none',
               }}
             >
               Files
             </TabsTrigger>
             <TabsTrigger 
               value="activities" 
               className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg"
               style={{
                 backgroundColor: activeTab === 'activities' ? `rgba(${colors.shadow}, 0.3)` : 'transparent',
                 color: activeTab === 'activities' ? colors.glow : 'inherit',
                 boxShadow: activeTab === 'activities' ? `0 0 10px rgba(${colors.shadow}, 0.3)` : 'none',
               }}
             >
               Activities
             </TabsTrigger>
             <TabsTrigger 
               value="jobs" 
               className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg"
               style={{
                 backgroundColor: activeTab === 'jobs' ? `rgba(${colors.shadow}, 0.3)` : 'transparent',
                 color: activeTab === 'jobs' ? colors.glow : 'inherit',
                 boxShadow: activeTab === 'jobs' ? `0 0 10px rgba(${colors.shadow}, 0.3)` : 'none',
               }}
             >
               Jobs
             </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{mockLead.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{mockLead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Assigned to: {mockLead.assignedTo}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Last Activity: {mockLead.lastActivityDate}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">{mockLead.lastActivity}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="border-2 transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `rgba(${colors.shadow}, 0.2)`,
                  borderColor: `rgba(${colors.border}, 0.5)`,
                  color: colors.glow,
                  boxShadow: `0 0 10px rgba(${colors.shadow}, 0.3)`,
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Lead
              </Button>
            </div>

            {/* Note Section with Overlaid Send Button */}
            <div className="relative">
              <Label className="text-slate-300 mb-2 block">Add Note</Label>
              <div className="relative">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this lead..."
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder-slate-500 pr-12 min-h-[80px] transition-all duration-300 focus:border-opacity-70"
                  style={{
                    borderColor: `rgba(${colors.border}, 0.3)`,
                    boxShadow: `0 0 5px rgba(${colors.shadow}, 0.1)`,
                  }}
                />
                <Button
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 p-0 border transition-all duration-300 hover:scale-110"
                  disabled={!noteText.trim()}
                  style={{
                    backgroundColor: `rgba(${colors.shadow}, 0.2)`,
                    borderColor: `rgba(${colors.border}, 0.5)`,
                    color: colors.glow,
                    boxShadow: `0 0 10px rgba(${colors.shadow}, 0.3)`,
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insurance" className="space-y-4">
            {!editingInsurance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-200">Insurance Information</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingInsurance(true)}
                    className="text-slate-400 hover:text-slate-200 transition-all duration-300"
                    style={{
                      color: colors.glow,
                      borderColor: `rgba(${colors.border}, 0.3)`,
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Company</Label>
                    <p className="text-slate-200">{mockLead.insuranceCompany}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Phone</Label>
                    <p className="text-slate-200">{mockLead.insurancePhone}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Email</Label>
                    <p className="text-slate-200">{mockLead.insuranceEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Claim Number</Label>
                    <p className="text-slate-200">{mockLead.claimNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Damage Type</Label>
                    <p className="text-slate-200">{mockLead.damageType}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Date of Loss</Label>
                    <p className="text-slate-200">{mockLead.dateOfLoss}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-200">Edit Insurance Information</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingInsurance(false)}
                      className="text-slate-400 hover:text-slate-200 transition-all duration-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="border-2 transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: `rgba(${colors.shadow}, 0.2)`,
                        borderColor: `rgba(${colors.border}, 0.5)`,
                        color: colors.glow,
                        boxShadow: `0 0 10px rgba(${colors.shadow}, 0.3)`,
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Company</Label>
                    <Input defaultValue={mockLead.insuranceCompany} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Phone</Label>
                    <Input defaultValue={mockLead.insurancePhone} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Email</Label>
                    <Input defaultValue={mockLead.insuranceEmail} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Claim Number</Label>
                    <Input defaultValue={mockLead.claimNumber} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Damage Type</Label>
                    <Input defaultValue={mockLead.damageType} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Date of Loss</Label>
                    <Input defaultValue={mockLead.dateOfLoss} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="adjuster" className="space-y-4">
            {!editingAdjuster ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-200">Adjuster Information</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAdjuster(true)}
                    className="text-slate-400 hover:text-slate-200 transition-all duration-300"
                    style={{
                      color: colors.glow,
                      borderColor: `rgba(${colors.border}, 0.3)`,
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Name</Label>
                    <p className="text-slate-200">{mockLead.insuranceAdjusterName}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Phone</Label>
                    <p className="text-slate-200">{mockLead.insuranceAdjusterPhone}</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-400">Email</Label>
                    <p className="text-slate-200">{mockLead.insuranceAdjusterEmail}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-200">Edit Adjuster Information</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAdjuster(false)}
                      className="text-slate-400 hover:text-slate-200 transition-all duration-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="border-2 transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: `rgba(${colors.shadow}, 0.2)`,
                        borderColor: `rgba(${colors.border}, 0.5)`,
                        color: colors.glow,
                        boxShadow: `0 0 10px rgba(${colors.shadow}, 0.3)`,
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Name</Label>
                    <Input defaultValue={mockLead.insuranceAdjusterName} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Phone</Label>
                    <Input defaultValue={mockLead.insuranceAdjusterPhone} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-400">Email</Label>
                    <Input defaultValue={mockLead.insuranceAdjusterEmail} className="bg-slate-800/50 border-slate-700/50 text-slate-200" />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-200">Files ({mockFiles.length})</h3>
              <Button 
                size="sm" 
                className="border-2 transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `rgba(${colors.shadow}, 0.2)`,
                  borderColor: `rgba(${colors.border}, 0.5)`,
                  color: colors.glow,
                  boxShadow: `0 0 10px rgba(${colors.shadow}, 0.3)`,
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {mockFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 transition-all duration-300 hover:bg-slate-800/40"
                  style={{
                    borderColor: `rgba(${colors.border}, 0.2)`,
                    boxShadow: `0 0 5px rgba(${colors.shadow}, 0.1)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileText 
                      className="h-5 w-5 text-slate-400" 
                      style={{ color: colors.glow }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-400">{file.size} • {file.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 transition-all duration-300"
                      style={{ color: colors.glow }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 transition-all duration-300"
                      style={{ color: colors.glow }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 transition-all duration-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200">Recent Activities</h3>
            <div className="space-y-3">
              {mockActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30 transition-all duration-300 hover:bg-slate-800/40"
                  style={{
                    borderColor: `rgba(${colors.border}, 0.2)`,
                    boxShadow: `0 0 5px rgba(${colors.shadow}, 0.1)`,
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0 animate-pulse" 
                    style={{ 
                      backgroundColor: colors.glow,
                      boxShadow: `0 0 5px ${colors.glow}`,
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{activity.title}</p>
                    <p className="text-xs text-slate-400">{activity.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.user} • {activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="text-center py-8">
              <Briefcase 
                className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-pulse" 
                style={{ color: colors.glow }}
              />
              <h3 className="text-lg font-medium text-slate-200 mb-2">Job Management</h3>
              <p className="text-slate-400 text-sm">Coming Soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default function TestLeadsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-200">Interactive Neon Lead Card</h1>
          <p className="text-slate-400">Status-based neon colors with smooth transitions</p>
        </div>

        <div className="flex justify-center">
          {/* Design 11: Enhanced Neon Status-Focused with Real Status Change */}
          <NeonLeadCard title="Design 11: Neon Status-Focused (Interactive)" />
        </div>
      </div>
    </div>
  )
} 