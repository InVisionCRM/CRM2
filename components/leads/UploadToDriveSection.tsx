import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface UploadToDriveSectionProps {
  leadId: string
}

// Category-based UI removed in favor of simplified upload

export const UploadToDriveSection: React.FC<UploadToDriveSectionProps> = ({ leadId }) => {
  const { toast } = useToast()

  const genericFileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  
  const handleOpenFilePicker = () => {
    genericFileInputRef.current?.click()
  }

  const handleGenericFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingFile(true)

    try {
      // First, get lead information to create proper filename structure
      const leadResponse = await fetch(`/api/leads/${leadId}`)
      if (!leadResponse.ok) {
        throw new Error('Failed to get lead information')
      }
      const leadData = await leadResponse.json()
      
      // Use simplified naming: other/LeadName/originalFileName
      const leadName = `${leadData.firstName || 'Unknown'} ${leadData.lastName || 'Lead'}`.trim()
      const customFileName = `other/${leadName}/${file.name}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('leadId', leadId)
      formData.append('fileType', 'other')
      formData.append('customFileName', customFileName) // Add the custom filename

      const res = await fetch('/api/files/upload-to-shared-drive', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      
      toast({ title: 'Success', description: `File uploaded!` })
    } catch (err) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploadingFile(false)
      if (genericFileInputRef.current) genericFileInputRef.current.value = ''
    }
  }

  /* ------------------------- UI ------------------------- */

  return (
    <div className="space-y-4 pb-4" id="upload-section">
      <h3 className="text-lg font-medium text-white text-center">Documents</h3>
      <div className="flex items-center justify-center gap-3 sm:gap-4 py-1">
        <a
          href={`/leads/${leadId}/files`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-white hover:bg-white/10 border-slate-600')}
        >
          <Eye className="h-4 w-4" />
          <span>View Documents</span>
        </a>
        <Button
          variant="outline"
          size="sm"
          disabled={isUploadingFile}
          onClick={handleOpenFilePicker}
          className={cn('rounded-lg border-2 text-white bg-gradient-to-b from-[#0f0f0f] via-[#1a1a1a] to-[#000] border-slate-600 hover:ring-2')}
        >
          {isUploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Documents'}
        </Button>
      </div>
      <input
        ref={genericFileInputRef}
        type="file"
        accept="*"
        onChange={handleGenericFileChange}
        className="hidden"
        aria-label="Upload document"
      />
    </div>
  )
}

export default UploadToDriveSection 