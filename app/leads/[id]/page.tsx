"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation" // Use next/navigation for App Router
import { LeadStatus } from "@prisma/client"
import { Phone, Mail, CalendarPlus, MapPin, AlertTriangle, CheckCircle2, XIcon, FileText, FileArchive, Image, FileSignature, Copy, Loader2, NotebookPen, PenTool, CheckCircle, CalendarDays, Calendar, Palette, DollarSign, Hammer, ArrowRight, Paintbrush, ClipboardList, Save, ChevronDown, Upload, Eye, Trash2, ExternalLink, Ruler, AtSign } from "lucide-react" // Added ClipboardList icon
import { StatusChangeDrawer } from "@/components/leads/StatusChangeDrawer"
import { LeadDetailTabs } from "@/components/leads/LeadDetailTabs"
import { ActivityFeed } from "@/components/leads/ActivityFeed"

import { Button } from "@/components/ui/button"
import { useLead } from "@/hooks/use-lead" // Corrected path
import { Skeleton } from "@/components/ui/skeleton"
import { updateLeadAction } from "@/app/actions/lead-actions" // Changed import
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from 'react'
import { formatStatusLabel } from "@/lib/utils"; // Import formatStatusLabel
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadFiles } from "@/components/leads/lead-files";
import { LeadPhotosTab } from "@/components/leads/tabs/LeadPhotosTab"; // Import the new Photos tab component
import { ScopeOfWorkDialog } from "@/components/leads/ScopeOfWorkDialog"; // Import the new Scope of Work dialog
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LeadOverviewTab } from "@/components/leads/tabs/LeadOverviewTab"
import { ImportantDates } from "@/components/leads/ImportantDates"
import { LeadEmailer } from "@/components/leads/LeadEmailer"
import { JobCompletionCard } from "@/components/leads/JobCompletionCard"
import { format, parseISO } from "date-fns"
import { ClientContractsDropdown } from "@/components/leads/ClientContractsDropdown"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Quick Actions Button component
interface QuickActionButtonProps {
  onClick?: () => void;
  href?: string;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'contract' | 'sign' | 'filemanager' | 'photos' | 'addnote' | 'email' | 'scopeofwork';
}

// File categories for upload
const FILE_CATEGORIES = [
  { key: 'general_contract', label: 'General Contract', color: 'orange' },
  { key: 'estimate', label: 'Estimate', color: 'blue' },
  { key: 'acv', label: 'ACV', color: 'emerald' },
  { key: 'supplement', label: 'Supplement', color: 'red' },
  { key: 'eagleview', label: 'EagleView', color: 'purple' },
  { key: 'scope_of_work', label: 'SOW', color: 'rose' },
  { key: 'warrenty', label: 'Warranty', color: 'indigo' },
  { key: 'other', label: 'Other', color: 'gray' }
] as const

type FileCategoryKey = (typeof FILE_CATEGORIES)[number]['key']

// Add Note Button with Hover Dropdown component
interface AddNoteButtonProps {
  leadId: string;
  onNoteAdded?: () => void;
}

// Upload Dropdown component
interface UploadDropdownProps {
  leadId: string;
  lead: any;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

const AddNoteButton: React.FC<AddNoteButtonProps> = ({ leadId, onNoteAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch users for @mentions
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true);
      try {
        const response = await fetch('/api/users/search?query=');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Handle @mention input detection
  const handleTextareaChange = (value: string) => {
    setNote(value);
    
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z\s]*)$/);
    
    if (atMatch) {
      setShowMentionDropdown(true);
      setMentionQuery(atMatch[1]);
      setCursorPosition(cursorPos);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  // Insert mention into textarea
  const insertMention = (user: User) => {
    if (!textareaRef.current) return;
    
    const beforeCursor = note.substring(0, cursorPosition);
    const afterCursor = note.substring(cursorPosition);
    const beforeAt = beforeCursor.replace(/@[a-zA-Z\s]*$/, '');
    const newValue = `${beforeAt}@${user.name} ${afterCursor}`;
    const newCursorPos = beforeAt.length + (user.name?.length || 0) + 2;
    
    setNote(newValue);
    setShowMentionDropdown(false);
    setMentionQuery("");
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Filter users based on mention query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast({
        title: "Note required",
        description: "Please enter a note before submitting.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to add note");
      setNote("");
      setIsOpen(false);
      setShowMentionDropdown(false);
      setMentionQuery("");
      toast({ title: "Note added", description: "Your note has been added successfully." });
      if (onNoteAdded) onNoteAdded();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative h-full" ref={dropdownRef}>
      <button
        type="button"
        className={cn(
          "relative flex h-full w-full items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
          "first:border-l-0 transition-all duration-300",
          "bg-gradient-to-br from-[#14110F]/90 via-[#14110F]/80 to-[#14110F]/90 border-l border-[#14110F]/50 hover:from-[#14110F]/80 hover:via-[#14110F]/70 hover:to-[#14110F]/80 hover:border-[#14110F]/60 hover:shadow-lg hover:shadow-[#14110F]/20",
          "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        )}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="p-1 bg-white/10 rounded-md">
            <NotebookPen className="h-4 w-4 text-[#e0e0e0]" />
          </div>
          <span className="text-xs leading-tight font-semibold text-[#e0e0e0]">Add Note</span>
        </div>
      </button>
      {isOpen && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 z-50 w-80 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-slate-600/50 backdrop-blur-xl shadow-2xl shadow-black/50 rounded-xl overflow-hidden p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-100">Quick Note</h3>
            <AtSign className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">Use @name to mention team members</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Enter your note here... Use @name to mention team members"
                value={note}
                onChange={(e) => handleTextareaChange(e.target.value)}
                className="min-h-[100px] resize-none text-sm bg-slate-900 text-white border-slate-700 focus:border-[#14110F] focus:ring-[#14110F]"
                disabled={isSubmitting}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && showMentionDropdown) {
                    setShowMentionDropdown(false);
                    setMentionQuery("");
                  }
                }}
              />
              
              {/* @Mention Dropdown */}
              {showMentionDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredUsers.slice(0, 5).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => insertMention(user)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2 text-white"
                    >
                      <AtSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{user.name || user.email}</div>
                        {user.name && (
                          <div className="text-xs text-gray-400">{user.email}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-400">
                {users.length > 0 ? (
                  `${users.length} team members available`
                ) : isLoadingUsers ? (
                  "Loading team members..."
                ) : (
                  "No team members found"
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNote("");
                    setIsOpen(false);
                    setShowMentionDropdown(false);
                    setMentionQuery("");
                  }}
                  disabled={isSubmitting}
                  className="border-slate-700 text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !note.trim()}
                  className="bg-[#14110F] hover:bg-[#14110F]/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-3 w-3" />
                      Save Note
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const UploadDropdown: React.FC<UploadDropdownProps> = ({ leadId, lead }) => {
  const { toast } = useToast()
  const [uploadedFileStatus, setUploadedFileStatus] = useState<Record<string, boolean>>({})
  const [uploadedFileUrls, setUploadedFileUrls] = useState<Record<string, string>>({})
  const [isCheckingFiles, setIsCheckingFiles] = useState<Record<string, boolean>>({})
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isDeletingFile, setIsDeletingFile] = useState<Record<string, boolean>>({})
  const [currentUploadType, setCurrentUploadType] = useState<FileCategoryKey | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if file exists
  const checkFileExists = async (fileType: string) => {
    if (!leadId) return { exists: false, fileUrl: null as string | null }
    try {
      const response = await fetch(`/api/files/check-file-exists?leadId=${leadId}&fileType=${fileType}`)
      if (!response.ok) return { exists: false, fileUrl: null }
      const data = await response.json()
      return { exists: data.exists as boolean, fileUrl: data.fileUrl as string | null }
    } catch {
      return { exists: false, fileUrl: null }
    }
  }

  // Refresh all file statuses
  const refreshAllStatuses = async () => {
    const checks = await Promise.all(
      FILE_CATEGORIES.map(async ({ key }) => {
        const res = await checkFileExists(key)
        return { key, ...res }
      })
    )
    const newStatus: Record<string, boolean> = {}
    const newUrls: Record<string, string> = {}
    checks.forEach(c => {
      newStatus[c.key] = c.exists
      if (c.exists && c.fileUrl) newUrls[c.key] = c.fileUrl
    })
    setUploadedFileStatus(newStatus)
    setUploadedFileUrls(newUrls)
  }

  // Load file statuses on mount
  useEffect(() => {
    refreshAllStatuses()
  }, [leadId])

  // Handle file upload
  const handleUploadFile = (fileType: FileCategoryKey) => {
    setCurrentUploadType(fileType)
    // Set accept attribute based on file type
    if (fileInputRef.current) {
      if (fileType === 'other') {
        fileInputRef.current.accept = '*' // Accept all file types for "Other"
      } else {
        fileInputRef.current.accept = '.pdf,.doc,.docx' // Specific file types for other categories
      }
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUploadType) return
    setIsUploadingFile(true)

    try {
      // Get lead information for filename
      const leadResponse = await fetch(`/api/leads/${leadId}`)
      if (!leadResponse.ok) {
        throw new Error('Failed to get lead information')
      }
      const leadData = await leadResponse.json()
      
      // Create custom filename
      const leadName = `${leadData.firstName || 'Unknown'} ${leadData.lastName || 'Lead'}`.trim()
      const fileExtension = file.name.split('.').pop() || 'pdf'
      
      let customFileName: string
      if (currentUploadType === 'other') {
        // For "Other" category, use the original filename structure from UploadToDriveSection
        customFileName = `other/${leadName}/${file.name}`
      } else {
        // For specific categories, use the structured naming
        customFileName = `${currentUploadType}/${leadName}/${leadId}.${fileExtension}`
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('leadId', leadId)
      formData.append('fileType', currentUploadType)
      formData.append('customFileName', customFileName)

      const res = await fetch('/api/files/upload-to-shared-drive', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      toast({ title: 'Success', description: `${currentUploadType === 'other' ? 'File' : currentUploadType} uploaded!` })
      await refreshAllStatuses()
    } catch (err) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploadingFile(false)
      setCurrentUploadType(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle file deletion
  const handleDeleteFile = async (fileType: FileCategoryKey) => {
    if (isDeletingFile[fileType]) return
    setIsDeletingFile(prev => ({ ...prev, [fileType]: true }))
    try {
      const checkResponse = await fetch(`/api/files/check-file-exists?leadId=${leadId}&fileType=${fileType}`)
      if (!checkResponse.ok) {
        throw new Error('Failed to find file')
      }
      
      const checkData = await checkResponse.json()
      if (!checkData.exists || !checkData.fileId) {
        throw new Error('File not found')
      }
      
      const response = await fetch(`/api/files/delete-from-shared-drive?driveFileId=${checkData.fileId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed')
      }
      toast({ title: 'Deleted', description: `${fileType === 'other' ? 'File' : fileType} removed` })
      await refreshAllStatuses()
    } catch {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
    } finally {
      setIsDeletingFile(prev => ({ ...prev, [fileType]: false }))
    }
  }

  // Get color classes for each file type
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'from-blue-600/20 to-blue-500/20 border-blue-500/30 text-blue-300 hover:from-blue-600/20 hover:to-blue-500/20 hover:shadow-blue-500/20 hover:border-blue-500/30',
      emerald: 'from-emerald-600/20 to-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:from-emerald-600/20 hover:to-emerald-500/20 hover:shadow-emerald-500/20 hover:border-emerald-500/30',
      red: 'from-red-600/20 to-red-500/20 border-red-500/30 text-red-300 hover:from-red-600/20 hover:to-red-500/20 hover:shadow-red-500/20 hover:border-red-500/30',
      purple: 'from-purple-600/20 to-purple-500/20 border-purple-500/30 text-purple-300 hover:from-purple-600/20 hover:to-purple-500/20 hover:shadow-purple-500/20 hover:border-purple-500/30',
      rose: 'from-rose-600/20 to-rose-500/20 border-rose-500/30 text-rose-300 hover:from-rose-600/20 hover:to-rose-500/20 hover:shadow-rose-500/20 hover:border-rose-500/30',
      indigo: 'from-indigo-600/20 to-indigo-500/20 border-indigo-500/30 text-indigo-300 hover:from-indigo-600/20 hover:to-indigo-500/20 hover:shadow-indigo-500/20 hover:border-indigo-500/30',
      orange: 'from-orange-600/20 to-orange-500/20 border-orange-500/30 text-orange-300 hover:from-orange-600/20 hover:to-orange-500/20 hover:shadow-orange-500/20 hover:border-orange-500/30',
      gray: 'from-gray-600/20 to-gray-500/20 border-gray-500/30 text-gray-300 hover:from-gray-600/20 hover:to-gray-500/20 hover:shadow-gray-500/20 hover:border-gray-500/30'
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="relative h-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "relative flex h-full w-full items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
              "first:border-l-0 transition-all duration-300",
              "bg-gradient-to-br from-teal-700/90 via-teal-600/90 to-teal-700/90 border-l border-teal-500/50 hover:from-teal-600/90 hover:via-teal-500/90 hover:to-teal-600/90 hover:border-teal-400/60 hover:shadow-lg hover:shadow-teal-500/20",
              "hover:scale-[1.02] active:scale-[0.98]",
              "cursor-pointer"
            )}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="p-1 bg-white/10 rounded-md">
                <Upload className="h-4 w-4 text-teal-200" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs leading-tight font-semibold text-teal-100">Upload</span>
                <ChevronDown className="h-3 w-3 text-teal-200 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-72 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-slate-600/50 backdrop-blur-xl shadow-2xl shadow-black/50 rounded-xl overflow-hidden p-2"
          side="bottom"
          align="center"
          sideOffset={8}
        >
          <div className="grid grid-cols-2 gap-2">
            {FILE_CATEGORIES.map(({ key, label, color }) => (
              <DropdownMenuItem
                key={key}
                disabled={isUploadingFile}
                onClick={() => handleUploadFile(key)}
                className={cn(
                  "flex items-center justify-between gap-1 text-white hover:bg-gradient-to-r focus:bg-gradient-to-r cursor-pointer p-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-transparent",
                  `hover:from-${getColorClasses(color)}.from/20 hover:to-${getColorClasses(color)}.to/20 focus:from-${getColorClasses(color)}.from/20 focus:to-${getColorClasses(color)}.to/20 hover:border-${getColorClasses(color)}.border/30`
                )}
              >
                <div className="flex items-center gap-1.5">
                  <div className={cn("p-1 rounded-md", `bg-gradient-to-br from-${getColorClasses(color)}.from/20 to-${getColorClasses(color)}.to/20`)}>
                    <Upload className={cn("h-3 w-3", `text-${getColorClasses(color)}.icon`)} />
                  </div>
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isCheckingFiles[key] ? (
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                  ) : uploadedFileStatus[key] ? (
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); window.open(uploadedFileUrls[key], '_blank'); }} className="text-blue-400 hover:text-blue-300"><Eye className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(key); }} disabled={isDeletingFile[key]} className="text-red-400 hover:text-red-300">
                        {isDeletingFile[key] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>
                  ) : null}
                </div>
              </DropdownMenuItem>
            ))}
            <div className="col-span-2 mt-1">
              <DropdownMenuItem
                asChild
                className="flex items-center gap-2 text-white hover:bg-gradient-to-r hover:from-cyan-600/20 hover:to-cyan-500/20 focus:bg-gradient-to-r focus:from-cyan-600/20 focus:to-cyan-500/20 cursor-pointer p-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-transparent hover:border-cyan-500/30"
              >
                <a href={`/leads/${leadId}/files`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                  <div className="p-1 rounded-md bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                    <ExternalLink className="h-3 w-3 text-cyan-300" />
                  </div>
                  <span className="text-xs font-semibold">File Manager</span>
                </a>
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload file for document category"
      />
    </div>
  )
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ onClick, href, label, disabled, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'contract':
        return "bg-[#635380] border-l border-[#635380] hover:bg-white/10";
      case 'sign':
        return "bg-[#E8871E] border-l border-[#E8871E] hover:bg-white/10";
      case 'filemanager':
        return "bg-[#276FBF] border-l border-[#276FBF] hover:bg-white/10";
      case 'photos':
        return "bg-[#D64933] border-l border-[#D64933] hover:bg-white/10";
      case 'addnote':
        return "bg-[#14110F] border-l border-[#14110F] hover:bg-white/10";
      case 'email':
        return "bg-[#1D4ED8] border-l border-[#1D4ED8] hover:bg-white/10";
      case 'scopeofwork':
        return "bg-[#059669] border-l border-[#059669] hover:bg-white/10";
      default:
        return "bg-gradient-to-b from-black/40 via-black/30 via-black/20 to-white border-1 hover:from-slate-800/30 hover:via-slate-800/20 hover:to-white";
    }
  };

  const getIcon = () => {
    if (label.includes('Send Contract') || label.includes('Sending')) {
      return <FileSignature className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Sign in Person') || label.includes('Creating')) {
      return <PenTool className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Add Note')) {
      return <NotebookPen className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Photos')) {
      return <Image className="h-4 w-4 mr-1" />;
    }
    if (label.includes('File Manager')) {
      return <FileText className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Send Email')) {
      return <Mail className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Scope of Work')) {
      return <ClipboardList className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  const commonProps = {
    className: cn(
      "relative flex h-full w-full items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
      "first:border-l-0 transition-all duration-300",
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

// Date Card Component for Lead Created and Job Completion
interface DateCardProps {
  title: string;
  date: Date | string | null;
  icon: React.ReactNode;
  className?: string;
  color?: string; // optional accent color for title & icon
  onClick?: () => void;
}

const DateCard: React.FC<DateCardProps> = ({ title, date, icon, className, color, onClick }) => {
  const formatDate = (dateValue: Date | string | null) => {
    if (!dateValue) return 'N/A'
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue
    return format(date, 'MMM d, yyyy')
  }

  const accentColor = color || '#FFFFFF';
  const formattedDate = formatDate(date);
  const dateObj = typeof date === 'string' ? parseISO(date as string) : date;
  const isPastDate = dateObj && dateObj < new Date();
  
  // Determine border color based on date status
  let borderClass = "border-gray-700";
  if (formattedDate) {
    borderClass = isPastDate ? "border-gray-500 border-2" : "border-lime-500 border-2";
  }

  return (
    <div className={cn(
      "h-16 p-2 flex flex-col items-center justify-center gap-0.5 rounded-lg border bg-black/60 transition-all duration-200",
      borderClass,
      className
    )}>
      <div className="flex-shrink-0" style={{ color: accentColor }}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-center leading-tight" style={{ color: accentColor }}>
        {title}
      </span>
      {formattedDate && (
        <span className="text-xs text-white text-center leading-tight font-semibold">
          {formattedDate}
        </span>
      )}
      {!formattedDate && (
        <span className="text-xs text-gray-400 text-center leading-tight mt-0.5">
          Not set
        </span>
      )}
    </div>
  );
};

// Status Progression Component
interface StatusProgressionProps {
  currentStatus: LeadStatus;
  leadId: string;
  onStatusChange: (status: LeadStatus) => void;
  isLoading: boolean;
  loadingStatus: LeadStatus | null;
}

const StatusProgression: React.FC<StatusProgressionProps> = ({
  currentStatus,
  leadId,
  onStatusChange,
  isLoading,
  loadingStatus
}) => {
  // Define the status progression order as specified
  const statusOrder: { status: LeadStatus; label: string; abbrev: string }[] = [
    { status: LeadStatus.follow_ups, label: "Follow Up", abbrev: "F-UP" },
    { status: LeadStatus.signed_contract, label: "Signed Contract", abbrev: "SIGN" },
    { status: LeadStatus.scheduled, label: "Scheduled", abbrev: "SCHED" },
    { status: LeadStatus.colors, label: "Colors", abbrev: "COLOR" },
    { status: LeadStatus.acv, label: "ACV", abbrev: "ACV" },
    { status: LeadStatus.job, label: "Job", abbrev: "JOB" },
    { status: LeadStatus.completed_jobs, label: "Completed Job", abbrev: "DONE" },
    { status: LeadStatus.zero_balance, label: "Zero Balance", abbrev: "PAID" },
    { status: LeadStatus.denied, label: "Denied", abbrev: "DEN" }
  ];

  const currentIndex = statusOrder.findIndex(item => item.status === currentStatus);

  // Map status to color and icon
  const statusMeta: Record<LeadStatus, { color: string; icon: React.ReactNode }> = {
    [LeadStatus.follow_ups]: { color: '#6B7280', icon: <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.signed_contract]: { color: '#635380', icon: <FileSignature className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.scheduled]: { color: '#E8871E', icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.colors]: { color: '#059669', icon: <Palette className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.acv]: { color: '#2563EB', icon: <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.job]: { color: '#F59E0B', icon: <Hammer className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.completed_jobs]: { color: '#10B981', icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.zero_balance]: { color: '#22C55E', icon: <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.denied]: { color: '#EF4444', icon: <XIcon className="h-3 w-3 sm:h-4 sm:w-4" /> },
  }

  // Ref for auto-centering
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const currentBtn = buttonRefs.current[currentIndex]
    if (currentBtn && containerRef.current) {
      currentBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [currentIndex])

  const getStatusStyle = (status: LeadStatus, index: number) => {
    const meta = statusMeta[status]
    const isCurrent = status === currentStatus
    const distance = Math.abs(index - currentIndex)

    // Simplified styles for better click handling
    const base = "relative flex items-center justify-center text-white rounded-full transition-all duration-300 cursor-pointer select-none border-2 hover:scale-105 active:scale-95"
    const size = distance === 0 ? "w-12 h-12 sm:w-14 sm:h-14 text-[10px]" : distance === 1 ? "w-10 h-10 sm:w-12 sm:h-12 text-[9px]" : distance === 2 ? "w-8 h-8 sm:w-10 sm:h-10 text-[8px]" : "w-7 h-7 sm:w-8 sm:h-8 text-[6px]"
    const opacity = distance === 0 ? "opacity-100" : distance === 1 ? "opacity-90" : distance === 2 ? "opacity-60" : "opacity-30"
    const scale = distance === 0 ? "scale-110" : distance === 1 ? "scale-95" : distance === 2 ? "scale-85" : "scale-70"

    return `${base} ${size} ${opacity} ${scale}`
  }

  return (
    <div className="w-full px-2 sm:px-4 relative z-10">
      <div 
        ref={containerRef}
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto overflow-y-visible pb-4 scrollbar-hide scroll-smooth px-4 sm:px-6 relative"
        style={{ minHeight: '80px' }}
      >
        {statusOrder.map((item, index) => {
          const meta = statusMeta[item.status]
          const isCurrent = item.status === currentStatus
          const distance = Math.abs(index - currentIndex)
          const isPast = index < currentIndex

          return (
            <div key={item.status} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] sm:text-[10px] leading-none whitespace-nowrap pointer-events-none">{item.abbrev}</span>
                <button
                  ref={el => {
                    buttonRefs.current[index] = el;
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Status button clicked:', item.status);
                    onStatusChange(item.status);
                  }}
                  style={{ backgroundColor: meta.color, borderColor: meta.color }}
                  className={getStatusStyle(item.status, index)}
                  type="button"
                                  >
                    <span className="pointer-events-none">
                      {meta.icon}
                    </span>
                    {isCurrent && (
                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute -bottom-1 pointer-events-none"/>
                   )}
                </button>
              </div>
              {/* connector */}
              {index < statusOrder.length - 1 && (
                <div
                  className="h-0.5 w-4 sm:w-6 rounded-full"
                  style={{ backgroundColor: isPast ? '#00ff7f' : '#4B5563', boxShadow: isPast ? '0 0 6px rgba(0,255,128,0.6)' : undefined }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// SectionNavButton component
const SectionNavButton: React.FC<{ label: string; color: string; onClick: () => void }> = ({ label, color, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'text-[11px] sm:text-xs font-semibold py-2 px-2 rounded-md bg-black/0 hover:bg-white/10',
      color,
      'w-full transition-colors duration-200 whitespace-nowrap'
    )}
  >
    {label}
  </button>
);

// Mobile top navigation bar (visible on screens < sm)
const MobileNavBar: React.FC<{ onNavigate: (id: string) => void }> = ({ onNavigate }) => {
  const buttons = [
    { label: 'Schedule', id: 'schedule-info', color: 'text-white' },
    { label: 'Contracts', id: 'contracts-info', color: 'text-white' },
    { label: 'Upload', id: 'upload-info', color: 'text-white' },
    { label: 'Summary', id: 'summary-info', color: 'text-white' },
    { label: 'Contact', id: 'contact-info', color: 'text-white' },
    { label: 'Insurance', id: 'insurance-info', color: 'text-white' },
    { label: 'Adjuster', id: 'adjuster-info', color: 'text-white' },
    { label: 'Activity', id: 'activity-info', color: 'text-white' },
  ] as const;

  return (
    <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-white/20">
      <div className="flex overflow-x-auto no-scrollbar px-2 py-3 gap-2 items-center">
        {buttons.map((b, idx) => (
          <React.Fragment key={b.id}>
            <SectionNavButton label={b.label} color={b.color} onClick={() => onNavigate(b.id)} />
            {idx !== buttons.length - 1 && <span className="h-4 w-px bg-white/20" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default function LeadDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams(); // Get search params
  const router = useRouter(); // Add router for navigation
  const id = typeof params?.id === 'string' ? params.id : undefined;
  
  const { lead, isLoading: isLeadLoading, error, mutate } = useLead(id) // useLead hook handles undefined id
  
  // Determine initial tab: from URL query or default to "overview"
  const initialTab = searchParams?.get("tab") === "files" ? "files" : "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const { toast } = useToast()

  // Street View related state
  const [streetViewUrl, setStreetViewUrl] = useState<string>("")
  const [isStreetViewLoading, setIsStreetViewLoading] = useState(true)
  const [streetViewError, setStreetViewError] = useState<string | null>(null)

  // Contract and dialog state
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [isSigningInPerson, setIsSigningInPerson] = useState(false);
  const [showContractSaveDialog, setShowContractSaveDialog] = useState(false);
  const [completedContracts, setCompletedContracts] = useState<any[]>([]);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [dialogDismissed, setDialogDismissed] = useState(false);

  // Dialog states
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [scopeOfWorkDialogOpen, setScopeOfWorkDialogOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Add a reference to the activity feed for refreshing
  const activityFeedRef = useRef<HTMLDivElement>(null);
  // Refs for section navigation
  const summaryRef = useRef<HTMLDivElement>(null);
  const activityRef = activityFeedRef; // reuse existing ref

  const [refreshActivities, setRefreshActivities] = useState(0);
  
  // Function to refresh activities when new note is added
  const handleNoteAdded = () => {
    // Increment refresh counter to trigger useEffect in ActivityFeed
    setRefreshActivities(prev => prev + 1);
  };

  // Street View URL generation
  useEffect(() => {
    if (lead?.address) {
      setIsStreetViewLoading(true)
      setStreetViewError(null)
      
      const url = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(lead.address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      setStreetViewUrl(url)
    }
  }, [lead?.address])

  // Check for completed contracts
  const checkCompletedContracts = async () => {
    if (!lead?.id) return;

    try {
      const response = await fetch(`/api/leads/${lead.id}/contracts/completed`);
      if (response.ok) {
        const data = await response.json();
        const completed = data.contracts?.filter((contract: any) => 
          contract.status === 'completed' || contract.status === 'signed'
        ) || [];
        
        setCompletedContracts(completed);
        
        // Show save dialog if there are completed contracts and dialog hasn't been dismissed
        if (completed.length > 0 && !dialogDismissed) {
          // Add a small delay to ensure UI is ready
          setTimeout(() => {
            setShowContractSaveDialog(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error checking completed contracts:', error);
    }
  };

  // Check for completed contracts when component mounts or lead changes
  useEffect(() => {
    if (lead?.id && !dialogDismissed) {
      // Add a delay to avoid showing immediately
      const timer = setTimeout(() => {
        checkCompletedContracts();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lead?.id, dialogDismissed]);

  // Effect to update activeTab if query parameter changes after initial load (optional, but good practice)
  useEffect(() => {
    const tabFromQuery = searchParams?.get("tab");
    if (tabFromQuery === "files" && activeTab !== "files") {
      setActiveTab("files");
    } else if (!tabFromQuery && activeTab !== "overview" && !searchParams?.has("tab")) {
      // If no tab query param and current tab is not overview, reset to overview (or keep current based on preference)
      // For now, let's be explicit: if 'files' is in query, switch to it. Otherwise, initialTab handles default.
    }
  }, [searchParams, activeTab]);

  // Helper function to get important date from metadata
  const getImportantDateFromMetadata = (dateKey: string): string | null => {
    const metadata = lead?.metadata as Record<string, any> | null;
    return metadata?.importantDates?.[dateKey] || null;
  };

  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusBeingUpdated, setStatusBeingUpdated] = useState<LeadStatus | null>(null);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) {
      console.error("Cannot update status: no lead found");
      return;
    }
    if (isStatusUpdating) return; // Prevent multiple updates

    setIsStatusUpdating(true);
    setStatusBeingUpdated(newStatus);

    try {
      const result = await updateLeadAction(lead.id, { status: newStatus });

      if (result.success) {
        console.log("Lead status updated successfully:", result);
        mutate(); // Refresh lead data
        
        // Show success toast
        toast({
          title: "✅ Success",
          description: `Lead status updated to ${formatStatusLabel(newStatus)}`,
        });
      } else {
        console.error("Failed to update lead status:", result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to update lead status",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to update lead status:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
      setStatusBeingUpdated(null);
    }
  };

  const handleScheduleAppointment = () => {
    if (!lead || !id) return;
    
    // Create a URL-safe version of the lead name
    const leadName = lead.firstName && lead.lastName 
      ? `${lead.firstName} ${lead.lastName}` 
      : lead.email || 'Unknown Lead';
    
    // Route to calendar with lead info
    window.location.href = `/dashboard/calendar?leadId=${id}&leadName=${encodeURIComponent(leadName)}&returnUrl=${encodeURIComponent(`/leads/${id}`)}`;
  };

  const handleSendContract = async () => {
    if (!lead) return;
    
    setIsSendingContract(true);
    setShowLoadingDialog(true);
    
    try {
      const response = await fetch('/api/docuseal/send-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: lead.id,
          templateId: 2 // Default to Scope of Work template
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Show success toast instead of confetti
        toast({
          title: "✅ Contract Sent Successfully!",
          description: `Contract has been sent to ${data.email || lead.email}`,
        });
        
        mutate();
        setShowLoadingDialog(false);
      } else {
        throw new Error('Failed to send contract');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send contract. Please try again.",
        variant: "destructive",
      });
      setShowLoadingDialog(false);
    } finally {
      setIsSendingContract(false);
    }
  };

  const handleSignInPerson = async () => {
    if (!lead) return;
    
    setIsSigningInPerson(true);
    
    try {
      const response = await fetch('/api/docuseal/sign-in-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: lead.id
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.signingUrl) {
          window.open(result.signingUrl, '_blank');
          
          // Success toast
          toast({
            title: "✅ In-Person Signing Created!",
            description: "Opening signing session in new tab",
          });
          
          // Center notification about Chrome and Pop-ups
          setTimeout(() => {
            toast({
              title: "📋 Important Notice",
              description: "Please ensure you are using Chrome browser and have Pop-Ups enabled for the best signing experience.",
              duration: 8000,
            });
          }, 1500);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Create Signing Session",
          description: error.error || "Failed to create in-person signing",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating in-person signing:', error);
      toast({
        title: "Error",
        description: "Failed to create in-person signing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningInPerson(false);
    }
  };

  const handleSaveContractsToDrive = async () => {
    if (!lead?.id || completedContracts.length === 0) return;

    setIsSavingToDrive(true);

    try {
      const response = await fetch(`/api/leads/${lead.id}/contracts/save-to-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contracts: completedContracts })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Success!",
          description: `${completedContracts.length} contract(s) saved to Google Drive`,
        });
        setShowContractSaveDialog(false);
        setDialogDismissed(true); // Prevent dialog from showing again
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || 'Failed to save contracts to Google Drive.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving contracts:', error);
      toast({
        title: "Error",
        description: 'Failed to save contracts. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Construct address string safely
  const addressString = lead 
    ? lead.address || "Address not available" // Use the single address field, provide fallback for null
    : "Loading address...";

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  };

  const handleOpenFilesDialog = () => setFilesDialogOpen(true);
  const handleCloseFilesDialog = () => setFilesDialogOpen(false);
  const handleOpenPhotosDialog = () => setPhotosDialogOpen(true);
  const handleClosePhotosDialog = () => setPhotosDialogOpen(false);
  const handleOpenEmailDialog = () => setEmailDialogOpen(true);
  const handleCloseEmailDialog = () => setEmailDialogOpen(false);
  const handleOpenScopeOfWorkDialog = () => setScopeOfWorkDialogOpen(true);
  const handleCloseScopeOfWorkDialog = () => setScopeOfWorkDialogOpen(false);

  const handleOpenEstimator = async () => {
    if (!lead?.address) {
      toast({
        title: "Address Missing",
        description: "Cannot open estimator because the lead has no address.",
        variant: "destructive",
      })
      return
    }
    
    setIsGeocoding(true)
    try {
      const response = await fetch('/api/geocode/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: lead.address }),
      })
      
      if (response.ok) {
        const data = await response.json();
        // Navigate to the roof estimator page with coordinates
        router.push(`/roof-estimator?lat=${data.lat}&lng=${data.lng}`)
      } else {
        // Navigate to the roof estimator page without coordinates
        router.push('/roof-estimator')
        toast({
          title: "Geocoding Failed",
          description: "Could not find coordinates for the address. You can still use the estimator by searching for the address.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Navigate to the roof estimator page without coordinates
      router.push('/roof-estimator')
      toast({
        title: "Error",
        description: "An error occurred while preparing the estimator. You can still use the estimator by searching for the address.",
        variant: "destructive",
      })
    } finally {
      setIsGeocoding(false)
    }
  }

  if (isLeadLoading && !lead) { // Show skeleton only on initial load
    return <LeadDetailSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-lg mx-auto border-destructive/50">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" /> Error Loading Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-2">
              {error?.message || "The requested lead could not be found or an error occurred."}
            </p>
            <p className="text-sm text-muted-foreground">Lead ID: {id || "Unknown"}</p>
            <Button onClick={() => mutate()} className="mt-4">Try Reloading</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!lead) { // Handle case where lead is null after loading (e.g. not found, but no error from hook)
     return (
      <div className="container mx-auto py-10 text-center">
         <p className="text-xl text-muted-foreground">Lead not found.</p>
         <p className="text-sm text-muted-foreground">Lead ID: {id || "Unknown"}</p>
      </div>
    )
  }

  const leadEmail = lead.email;
  const leadPhone = lead.phone;
  const leadAddress = lead.address;

  return (
    <>
      <div className="container mx-auto px-4 pt-4 sm:px-6 sm:py-8 space-y-4 md:space-y-6 relative">
        {/* Status Progression - Top of page */}
        <div className="w-full mb-6">
          <StatusProgression
            currentStatus={lead.status}
            leadId={lead.id}
            onStatusChange={handleStatusChange}
            isLoading={isStatusUpdating}
            loadingStatus={statusBeingUpdated}
          />
        </div>

        {/* Name and Claim Number Row */}
        <div className="w-full flex justify-between items-center mb-4">
          {/* Lead Name - Left */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
            {lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.email || lead.phone || "Lead Details"}
          </h1>
          
          {/* Claim Number - Right, above streetview */}
          {lead.claimNumber && (
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[8px] sm:text-[10px]">Claim #</span>
              <span className="text-green-500 text-lg sm:text-xl font-medium">{lead.claimNumber}</span>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-4 sm:gap-6">
          {/* Street View Section */}
          {lead?.address && (
            <div className="w-full">
              <Card className="w-full overflow-hidden">
                <CardContent className="p-0">
                  {streetViewUrl && (
                    <div className="relative w-full h-[400px]">
                      {/* Address Overlay */}
                      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-slate-900/70 p-2 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-300" />
                          <span className="truncate text-sm font-medium text-gray-100">{lead.address}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenEstimator}
                          disabled={isGeocoding}
                          className="flex-shrink-0 text-blue-400 hover:text-blue-300"
                        >
                          {isGeocoding ? "Loading..." : "Estimator"}
                        </Button>
                      </div>
                      
                      {/* Date Cards Overlay */}
                      <div className="absolute top-14 left-2 z-10 flex gap-2">
                        <DateCard
                          title="Created"
                          date={lead.createdAt}
                          icon={<CalendarDays className="h-[25px] w-4" />}
                          color="#51D6FF"
                          className="w-28"
                        />
                        <div className="w-28">
                          <JobCompletionCard lead={lead} />
                        </div>
                      </div>
                      
                      <img
                        src={streetViewUrl}
                        alt={`Street view of ${lead.address}`}
                        className="w-full h-full object-cover"
                        onLoad={() => setIsStreetViewLoading(false)}
                        onError={() => {
                          setIsStreetViewLoading(false)
                          setStreetViewError("Failed to load Street View image")
                        }}
                      />
                      {isStreetViewLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <Skeleton className="w-full h-full" />
                        </div>
                      )}
                      {streetViewError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                          <p>{streetViewError}</p>
                        </div>
                      )}
                                            <div className="absolute bottom-0 left-0 right-0 grid grid-cols-5 sm:flex w-full text-center border-t-2 border-white rounded-t-xl shadow-inner shadow-black/40 bg-black/60 backdrop-blur">
                        <div className="col-span-1 sm:flex-1">
                          <QuickActionButton
                            onClick={handleOpenPhotosDialog}
                            label="Photos"
                            variant="photos"
                          />
                        </div>
                        <div className="col-span-1 sm:flex-1">
                          <AddNoteButton
                            leadId={lead.id}
                            onNoteAdded={handleNoteAdded}
                          />
                        </div>
                        <div className="col-span-1 sm:flex-1">
                          <UploadDropdown
                            leadId={lead.id}
                            lead={lead}
                          />
                        </div>
                        <div className="col-span-1 sm:flex-1">
                          <ImportantDates
                            lead={lead}
                          />
                        </div>
                        <div className="col-span-1 sm:flex-1">
                          <ClientContractsDropdown
                            onSendContract={handleSendContract}
                            onSignInPerson={handleSignInPerson}
                            onScopeOfWork={handleOpenScopeOfWorkDialog}
                            isSendingContract={isSendingContract}
                            isSigningInPerson={isSigningInPerson}
                            disabled={!lead}
                            lead={lead}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-lime-500/50 to-transparent my-2 sm:my-3" />
              
        {/* Divider under quick action tabs */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />
        
        {/* Main content area - Two column layout on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">
          {/* Left column - Lead Detail Tabs and Add Note */}
          <div className="flex flex-col gap-6">
            <div className="space-y-4" ref={summaryRef} id="summary-info">
              <LeadDetailTabs 
                lead={lead}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              {/* Divider under lead overview tab */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />
            </div>
          </div>

          {/* Right column - Activity Feed only */}
          <div className="w-full" ref={activityRef} id="activity-info">
            <ActivityFeed leadId={lead.id} key={refreshActivities} />
          </div>
        </div>

        {/* Files Dialog */}
        <Dialog open={filesDialogOpen} onOpenChange={handleCloseFilesDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Files</DialogTitle>
            </DialogHeader>
            <LeadFiles leadId={lead.id} />
          </DialogContent>
        </Dialog>

        {/* Photos Dialog */}
        <Dialog open={photosDialogOpen} onOpenChange={handleClosePhotosDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Photos</DialogTitle>
            </DialogHeader>
            <LeadPhotosTab 
              leadId={lead.id}
              claimNumber={lead.claimNumber || undefined}
            />
          </DialogContent>
        </Dialog>

        {/* Emailer Dialog */}
        {lead && (
          <LeadEmailer lead={lead} open={emailDialogOpen} onOpenChange={handleCloseEmailDialog} />
        )}

        {/* Scope of Work Dialog */}
        {lead && (
          <ScopeOfWorkDialog 
            lead={lead} 
            open={scopeOfWorkDialogOpen} 
            onOpenChange={handleCloseScopeOfWorkDialog} 
          />
        )}

        <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
          <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-6 gap-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-lg font-medium">Processing...</span>
            </div>
            <p className="text-center text-muted-foreground">
              Your contract is being sent. This may take a few moments.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

function LeadDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8 space-y-4 md:space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2 sm:mb-0">
        <Skeleton className="h-8 w-48 sm:w-72" />
      </div>
      
      <Card className="p-3 sm:p-4">
        <Skeleton className="h-4 sm:h-5 w-20 sm:w-24 mb-2 sm:mb-3" />
        <div className="flex flex-wrap gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-[calc(25%-0.5rem)] sm:h-16 sm:w-[calc(14.28%-0.5rem)] min-w-[3.5rem] rounded-md" />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-lg" />
        ))}
      </div>

      <div className="mb-3 sm:mb-4">
        <Skeleton className="h-10 w-full rounded-lg md:hidden" />
        <Skeleton className="h-10 w-full rounded-lg hidden md:block" />
      </div>
      <Card>
        <CardContent className="p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
          <Skeleton className="h-full w-full rounded-md" />
        </CardContent>
      </Card>

      <Card className="mt-4 md:mt-6">
        <CardHeader><Skeleton className="h-5 sm:h-6 w-28 sm:w-32" /></CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_,i) => { return <Skeleton key={i} className="h-10 sm:h-12 w-full" />; })}
        </CardContent>
      </Card>
    </div>
  )
}