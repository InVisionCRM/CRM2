"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addHours, parseISO, formatDistanceToNow } from "date-fns"
import type { LeadSummary } from "@/types/dashboard"
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
  Loader2,
  UserCircle,
  Upload,
  CheckCircle2,
  DollarSign,
  CalendarPlus,
  ChevronDownIcon,
  Camera,
  NotebookPen,
  FileSignature,
  PenTool,
  CalendarIcon,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"
import { updateLeadStatus } from "@/app/actions/lead-actions"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InlineEditDialog } from "@/components/leads/inline-edit-dialog"
import { StreetViewTooltip } from "@/components/leads/street-view-tooltip"
import { LeadFiles } from "@/components/leads/lead-files"
import { LeadPhotosTab } from "@/components/leads/tabs/LeadPhotosTab"
import { motion, AnimatePresence } from "framer-motion"

interface LeadsListProps {
  leads: LeadSummary[]
  isLoading?: boolean
  assignedTo?: string | null
  onViewActivity: (lead: LeadSummary) => void
  onViewFiles: (lead: LeadSummary) => void
}

interface EventCreationData {
  type: 'adjuster' | 'build' | 'acv' | 'rcv'
  label: string
  title: string
  description: string
  icon: React.ReactNode
}

interface CalendarEvent {
  start?: {
    dateTime?: string
    date?: string
  }
  htmlLink?: string
  [key: string]: unknown
}

interface QuickActionButtonProps {
  onClick?: () => void;
  href?: string;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'contract' | 'sign';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ onClick, href, label, disabled, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'contract':
        return "bg-gradient-to-b from-blue-600/40 via-blue-500/30 to-blue-400/20 border-l border-blue-400 hover:from-blue-500/50 hover:via-blue-400/40 hover:to-blue-300/30";
      case 'sign':
        return "bg-gradient-to-b from-purple-600/40 via-purple-500/30 to-purple-400/20 border-l border-purple-400 hover:from-purple-500/50 hover:via-purple-400/40 hover:to-purple-300/30";
      default:
        return "bg-gradient-to-b from-black/40 via-black/30 via-black/20 to-lime-500/30 border-l border-lime-500 hover:from-slate-800/30 hover:via-slate-800/20 hover:to-lime-500/30";
    }
  };

  const getIcon = () => {
    if (label.includes('Send Contract') || label.includes('Sending')) {
      return <Send className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Sign Contract') || label.includes('Creating')) {
      return <PenTool className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Add Note')) {
      return <NotebookPen className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Photos')) {
      return <Camera className="h-4 w-4 mr-1" />;
    }
    if (label.includes('File Manager')) {
      return <FileText className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  const commonProps = {
    className: cn(
      "relative flex h-16 flex-1 items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
      "first:border-l-0 transition-all duration-200",
      getVariantStyles(),
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
    ),
  };

  const Tag = href && !onClick ? 'a' : 'button';
  const tagProps = {
    ...commonProps,
    ...(href && !onClick ? { href: disabled ? undefined : href, target: "_blank", rel: "noopener noreferrer" } : { onClick, type: "button" as const, disabled }),
  };

  return (
    <Tag {...tagProps}>
      <div className="flex flex-col items-center justify-center gap-1">
        {getIcon()}
        <span className="text-xs leading-tight">{label}</span>
      </div>
    </Tag>
  );
};

// Helper function for string truncation
const truncateString = (str: string | null | undefined, num: number): string => {
  if (!str) return "N/A";
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
};

// Helper function to parse address and return only street address and city
const parseAddressStreetAndCity = (fullAddress: string | null | undefined): string => {
  if (!fullAddress) return "No address available";
  
  // Split by comma and take first two parts (street address, city)
  const parts = fullAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    // Return street address and city only
    return `${parts[0]}, ${parts[1]}`;
  }
  
  // If less than 2 parts, return the full address
  return fullAddress;
};

// Updated status colors for neon theme
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

// Helper to get Google Maps URL for navigation
const getGoogleMapsUrl = (address: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

// Helper to format dates consistently
const formatDate = (date: Date | string | null): string => {
  if (!date) return "Not set";
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    return format(parsedDate, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "Invalid date";
  }
};

// Helper to get salesperson initials
const getSalespersonInitials = (name: string | null | undefined): string => {
  if (!name) return "N/A";
  return name.substring(0, 2).toUpperCase();
};

// Neon Lead Card Component
function NeonLeadCard({ lead, className = "" }: { lead: LeadSummary, className?: string }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [noteText, setNoteText] = useState("")
  const [editingInsurance, setEditingInsurance] = useState(false)
  const [editingAdjuster, setEditingAdjuster] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status || LeadStatus.follow_ups)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  // Expanded by default on non-mobile screens
  const [isExpanded, setIsExpanded] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false)
  const { toast } = useToast()

  // Handle status change with real API call
  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true)
    try {
      const result = await updateLeadStatus(lead.id, newStatus)
      if (result.success) {
        setCurrentStatus(newStatus)
        toast({
          title: "Status Updated",
          description: `Lead status changed to ${formatStatusLabel(newStatus)}`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const colors = getStatusColors(currentStatus)

  // Mock data for tabs (you can replace with real data)
  const mockActivities = [
    {
      id: "1",
      type: "phone_call",
      title: "Called client to schedule appointment",
      description: "Discussed available time slots for roof inspection",
      timestamp: new Date().toISOString(),
      user: lead.assignedTo || "System"
    },
    {
      id: "2", 
      type: "file_upload",
      title: "Uploaded inspection photos",
      description: "Added photos from initial assessment",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      user: lead.assignedTo || "System"
    },
    {
      id: "3",
      type: "status_change",
      title: "Status changed",
      description: `Lead moved to ${formatStatusLabel(currentStatus)} status`,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
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
      uploadedAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "estimate_worksheet.xlsx", 
      size: "156 KB",
      type: "Excel",
      category: "Estimates",
      uploadedAt: new Date().toISOString()
    }
  ]

  return (
    <div className="w-full space-y-2">
      {/* Compact Row - Always Visible */}
      <div 
        className="flex items-center justify-between p-3 sm:p-4 cursor-pointer transition-all duration-300 rounded-lg border backdrop-blur-sm"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          borderColor: `rgba(${colors.border}, 0.3)`,
          boxShadow: `0 0 10px rgba(${colors.shadow}, 0.1)`,
          background: `linear-gradient(135deg, 
            rgba(${colors.shadow}, 0.05) 0%, 
            rgba(15, 23, 42, 0.8) 30%, 
            rgba(15, 23, 42, 0.9) 70%, 
            rgba(${colors.shadow}, 0.05) 100%)`,
        }}
      >
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {/* Salesperson Avatar */}
          <div className="flex-shrink-0">
            <Avatar 
              className="h-8 w-8 sm:h-10 sm:w-10 bg-slate-700 border-2 transition-all duration-300"
              style={{
                borderColor: `rgba(${colors.border}, 0.5)`,
                boxShadow: `0 0 5px rgba(${colors.shadow}, 0.2)`,
              }}
            >
              <AvatarFallback className="text-slate-300 bg-slate-700 text-xs sm:text-sm">
                {getSalespersonInitials(lead.assignedTo)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Lead Name and Address */}
          <div className="flex-1 min-w-0">
            <Link 
              href={`/leads/${lead.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-slate-200 hover:text-slate-100 transition-colors block truncate text-sm sm:text-base"
            >
              {lead.name || "N/A"}
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{parseAddressStreetAndCity(lead.address)}</span>
            </p>
          </div>
        </div>

        {/* Expand Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Card 
              className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm transition-all duration-300 w-full"
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
                  Lead Details
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 transition-all duration-300"
                  style={{
                    borderColor: `rgba(${colors.border}, 0.3)`,
                    boxShadow: `0 0 15px rgba(${colors.shadow}, 0.1)`,
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar 
                      className="h-10 w-10 bg-slate-700 border-2 transition-all duration-300 flex-shrink-0"
                      style={{
                        borderColor: `rgba(${colors.border}, 0.5)`,
                        boxShadow: `0 0 10px rgba(${colors.shadow}, 0.2)`,
                      }}
                    >
                      <AvatarFallback className="text-slate-300 bg-slate-700">
                        {getSalespersonInitials(lead.assignedTo)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-200 truncate">{lead.name || "N/A"}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{lead.address || "No address"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                      <SelectTrigger 
                        className="w-[140px] sm:w-[180px] h-[40px] bg-slate-800/50 text-slate-200 transition-all duration-300 border-0"
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
                        className="h-4 w-4 animate-spin transition-all duration-300" 
                        style={{ color: colors.glow }}
                      />
                    )}
                  </div>
                </div>

                {/* Tabs with Enhanced Neon - Mobile Optimized */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList 
                    className="grid w-full grid-cols-3 sm:grid-cols-6 bg-slate-800/50 border transition-all duration-300"
                    style={{
                      borderColor: `rgba(${colors.border}, 0.3)`,
                      boxShadow: `0 0 10px rgba(${colors.shadow}, 0.1)`,
                    }}
                  >
                    <TabsTrigger 
                      value="overview" 
                      className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg text-xs sm:text-sm"
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
                      className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg text-xs sm:text-sm"
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
                      className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg text-xs sm:text-sm"
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
                      className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg text-xs sm:text-sm"
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
                      className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg text-xs sm:text-sm"
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
                      className="data-[state=active]:text-slate-200 transition-all duration-300 data-[state=active]:shadow-lg text-xs sm:text-sm"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{lead.phone || "No phone"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{lead.email || "No email"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Assigned to: {lead.assignedTo || "Unassigned"}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Created: {formatDate(lead.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Activity className="h-4 w-4" />
                          <span className="text-sm">Last Activity: {formatDate(lead.lastActivity)}</span>
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
                        asChild
                      >
                        <Link href={`/leads/${lead.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Lead
                        </Link>
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-200">Insurance Information</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingInsurance(!editingInsurance)}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-400">Company</Label>
                          <p className="text-slate-200">{lead.insuranceCompany || "Not set"}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400">Phone</Label>
                          <p className="text-slate-200">{lead.insurancePhone || "Not set"}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400">Claim Number</Label>
                          <p className="text-slate-200">{lead.claimNumber || "Not set"}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400">Damage Type</Label>
                          <p className="text-slate-200">{lead.damageType || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="adjuster" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-200">Adjuster Information</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAdjuster(!editingAdjuster)}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-400">Name</Label>
                          <p className="text-slate-200">{lead.insuranceAdjusterName || "Not set"}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400">Phone</Label>
                          <p className="text-slate-200">{lead.insuranceAdjusterPhone || "Not set"}</p>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-slate-400">Email</Label>
                          <p className="text-slate-200">{lead.insuranceAdjusterEmail || "Not set"}</p>
                        </div>
                      </div>
                    </div>
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
                            <p className="text-xs text-slate-500 mt-1">{activity.user} • {formatDate(activity.timestamp)}</p>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LeadsList({ leads, isLoading = false, assignedTo: _assignedTo, onViewActivity: _onViewActivity, onViewFiles: _onViewFiles }: LeadsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Pagination logic
  const totalPages = Math.ceil(leads.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentLeads = leads.slice(startIndex, endIndex)

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-slate-800/50 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No leads found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Leads List - Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {currentLeads.map((lead) => (
          <NeonLeadCard key={lead.id} lead={lead} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Show</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 bg-slate-800/50 border-slate-700/50 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-400">per page</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-700/50"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-700/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-slate-400 px-3">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-700/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="bg-slate-800/50 border-slate-700/50 text-slate-200 hover:bg-slate-700/50"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
