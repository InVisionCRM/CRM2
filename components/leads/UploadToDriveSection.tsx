import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Eye, Trash2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface UploadToDriveSectionProps {
  leadId: string
}

const FILE_CATEGORIES = [
  { key: 'general_contract', label: 'General Contract' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'acv', label: 'ACV' },
  { key: 'supplement', label: 'Supplement' },
  { key: 'eagleview', label: 'EagleView' },
  { key: 'scope_of_work', label: 'SOW' },
  { key: 'warrenty', label: 'Warranty' }
] as const

type FileCategoryKey = (typeof FILE_CATEGORIES)[number]['key']

export const UploadToDriveSection: React.FC<UploadToDriveSectionProps> = ({ leadId }) => {
  const { toast } = useToast()

  const genericFileInputRef = useRef<HTMLInputElement>(null)
  const [currentUploadType, setCurrentUploadType] = useState<FileCategoryKey | null>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isDeletingFile, setIsDeletingFile] = useState<Record<string, boolean>>({})
  const [isCheckingFiles, setIsCheckingFiles] = useState<Record<string, boolean>>({})
  const [uploadedFileStatus, setUploadedFileStatus] = useState<Record<string, boolean>>({})
  const [uploadedFileUrls, setUploadedFileUrls] = useState<Record<string, string>>({})

  /* ------------------------- Helpers ------------------------- */
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

  /* ------------------------- Initial load ------------------------- */
  useEffect(() => {
    refreshAllStatuses()
  }, [leadId])

  /* ------------------------- Upload ------------------------- */
  const handleUploadFile = (fileType: FileCategoryKey) => {
    setCurrentUploadType(fileType)
    genericFileInputRef.current?.click()
  }

  const handleGenericFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUploadType) return
    setIsUploadingFile(true)

    try {
      // First, get lead information to create proper filename structure
      const leadResponse = await fetch(`/api/leads/${leadId}`)
      if (!leadResponse.ok) {
        throw new Error('Failed to get lead information')
      }
      const leadData = await leadResponse.json()
      
      // Create the custom filename in format: fileType/LeadName/leadId.extension
      const leadName = `${leadData.firstName || 'Unknown'} ${leadData.lastName || 'Lead'}`.trim()
      const fileExtension = file.name.split('.').pop() || 'pdf'
      const customFileName = `${currentUploadType}/${leadName}/${leadId}.${fileExtension}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('leadId', leadId)
      formData.append('fileType', currentUploadType)
      formData.append('customFileName', customFileName) // Add the custom filename

      const res = await fetch('/api/files/upload-to-shared-drive', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      
      const uploadResult = await res.json()
      
      // If this is a general contract upload, create a contract record to mark it as completed
      if (currentUploadType === 'general_contract') {
        try {
          const contractResponse = await fetch('/api/contracts/manual-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: leadId,
              fileName: file.name,
              pdfUrl: uploadResult.file?.url || null
            })
          })
          
          if (contractResponse.ok) {
            const contractResult = await contractResponse.json()
            console.log('✅ Contract record created for general contract upload:', contractResult.contractId)
            toast({ 
              title: 'Contract Status Updated', 
              description: 'General contract uploaded and marked as completed!' 
            })
          } else {
            const errorData = await contractResponse.json()
            console.warn('⚠️ Failed to create contract record:', errorData.error)
          }
        } catch (contractError) {
          console.error('⚠️ Failed to create contract record, but file was uploaded:', contractError)
          // Don't fail the upload if contract creation fails
        }
      }
      
      toast({ title: 'Success', description: `${currentUploadType} uploaded!` })
      await refreshAllStatuses()
    } catch (err) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploadingFile(false)
      setCurrentUploadType(null)
      if (genericFileInputRef.current) genericFileInputRef.current.value = ''
    }
  }

  /* ------------------------- Delete ------------------------- */
  const handleDeleteFile = async (fileType: FileCategoryKey) => {
    if (isDeletingFile[fileType]) return
    setIsDeletingFile(prev => ({ ...prev, [fileType]: true }))
    try {
      // First, get the file ID by checking what files exist for this fileType
      const checkResponse = await fetch(`/api/files/check-file-exists?leadId=${leadId}&fileType=${fileType}`)
      if (!checkResponse.ok) {
        throw new Error('Failed to find file')
      }
      
      const checkData = await checkResponse.json()
      if (!checkData.exists || !checkData.fileId) {
        throw new Error('File not found')
      }
      
      // Delete the file using the actual Google Drive file ID
      const response = await fetch(`/api/files/delete-from-shared-drive?driveFileId=${checkData.fileId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed')
      }
      toast({ title: 'Deleted', description: `${fileType} removed` })
      await refreshAllStatuses()
    } catch {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
    } finally {
      setIsDeletingFile(prev => ({ ...prev, [fileType]: false }))
    }
  }

  /* ------------------------- UI ------------------------- */
  const colorMap: Record<string, string> = {
    estimate: 'border-blue-400 hover:ring-blue-400/60',
    acv: 'border-emerald-400 hover:ring-emerald-400/60',
    supplement: 'border-red-400 hover:ring-red-400/60',
    eagleview: 'border-purple-400 hover:ring-purple-400/60',
    scope_of_work: 'border-rose-400 hover:ring-rose-400/60',
    warrenty: 'border-indigo-400 hover:ring-indigo-400/60',
    general_contract: 'border-orange-400 hover:ring-orange-400/60'
  }

  return (
    <div className="space-y-4 pb-4" id="upload-section">
      <h3 className="text-lg font-medium text-white text-center">Upload to Drive</h3>
      <div className="flex overflow-x-auto no-scrollbar gap-3 sm:gap-4 py-1">
        {FILE_CATEGORIES.map(({ key, label }) => (
          <div key={key} className="relative group">
            <Button
              variant="outline"
              size="sm"
              disabled={isUploadingFile}
              onClick={() => handleUploadFile(key)}
              className={cn(
                'relative h-16 sm:h-14 min-w-[7rem] sm:min-w-[8rem] rounded-lg border-2 text-white flex flex-col items-center justify-center gap-1 text-base sm:text-lg bg-gradient-to-b from-[#0f0f0f] via-[#1a1a1a] to-[#000] shadow-[inset_0_0_8px_rgba(0,255,160,0.15),0_0_6px_rgba(0,255,160,0.1)] hover:shadow-[inset_0_0_12px_rgba(0,255,160,0.4),0_0_10px_rgba(0,255,160,0.3)] hover:ring-2',
                colorMap[key]
              )}
            >
              {isUploadingFile && currentUploadType === key && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{label}</span>
              {uploadedFileStatus[key] && <CheckCircle2 className="h-4 w-4 text-green-300" />}
            </Button>

            {/* Overlay */}
            {uploadedFileStatus[key] && (
              <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                {uploadedFileUrls[key] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(uploadedFileUrls[key], '_blank')
                    }}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeletingFile[key]}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFile(key)
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  {isDeletingFile[key] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <input
        ref={genericFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleGenericFileChange}
        className="hidden"
        aria-label="Upload file for document category"
      />
    </div>
  )
}

export default UploadToDriveSection 