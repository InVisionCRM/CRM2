"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLeadFiles } from "@/hooks/use-lead-files"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Eye, Camera, Trash2, Share2, XIcon, Loader2, FileIcon as LucideFileIcon } from "lucide-react"
import type { LeadFile } from "@/types/documents"
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { cn } from "@/lib/utils";
// We will need react-camera-pro if we proceed with its implementation
// import { Camera as ReactCameraPro } from "react-camera-pro";

interface LeadFilesProps {
  leadId: string
}

type ModalType = null | 'view' | 'upload' | 'camera';

export function LeadFiles({ leadId }: LeadFilesProps) {
  const { 
    files, 
    isLoading: isLoadingFiles, 
    error: filesError, 
    refreshFiles, 
    deleteFile, 
    uploadFile,
    isUploading,
  } = useLeadFiles(leadId);
  
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessConfetti, setShowSuccessConfetti] = useState(false);

  const openUploadModal = () => {
    setFilesToUpload([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setActiveModal('upload');
  };

  const closeModal = () => {
    setActiveModal(null);
    setShowSuccessConfetti(false);
  };

  const handleFileSelectForUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selected = Array.from(event.target.files);
      setFilesToUpload(selected);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    }
  };
  
  const handleActualUpload = async () => {
    if (filesToUpload.length === 0) return;

    let allSucceeded = true;

    for (const file of filesToUpload) {
      const result = await uploadFile(file, file.name);
      
      if (!result.success) {
        allSucceeded = false;
        toast({
          title: `Upload Failed: ${file.name}`,
          description: result.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    }
    
    if (allSucceeded && filesToUpload.length > 0) {
        toast({
          title: "Upload Successful",
          description: `${filesToUpload.length} file(s) uploaded.`,
        });
        setShowSuccessConfetti(true);
        setTimeout(() => setShowSuccessConfetti(false), 4000);
        closeModal();
    } else if (!allSucceeded && filesToUpload.length > 0) {
        // If some failed, don't close modal, user might want to retry or adjust
    }
    
    await refreshFiles();
  };
  
  const handleFileDelete = async (fileId: string, fileName: string) => {
    const result = await deleteFile(fileId);
    if (result.success) {
      toast({ title: "File Deleted", description: `${fileName} has been deleted.` });
    } else {
      toast({
        title: "Error Deleting File",
        description: result.error || `Failed to delete ${fileName}.`,
        variant: "destructive",
      });
    }
  };

  // Drag and Drop handlers
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDropOnUploadArea = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      setFilesToUpload(prev => [...prev, ...droppedFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      event.dataTransfer.clearData();
    }
  }, []);

  // Render functions for modals will go here
  const renderViewFilesModal = () => (
    <Dialog open={activeModal === 'view'} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>View Files</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          {isLoadingFiles && <p className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin inline mr-2"/>Loading files...</p>}
          {filesError && <p className="text-red-500 text-center py-4">Error: {filesError.message}</p>}
          {!isLoadingFiles && !filesError && files.length === 0 && (
            <p className="text-muted-foreground text-center py-10">No files uploaded yet.</p>
          )}
          {!isLoadingFiles && files.length > 0 && (
            <ul className="space-y-3">
              {files.map(file => (
                <li key={file.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border">
                  <div className="flex items-center gap-3 min-w-0">
                    {file.type?.startsWith("image/") ? <img src={file.url} alt={file.name} className="h-10 w-10 object-cover rounded" /> : <LucideFileIcon className="h-8 w-8 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {new Date(file.uploadedAt).toLocaleDateString()} | Size: {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 ml-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => window.open(file.url, '_blank')} title="View File">
                      <Eye className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                            if (navigator.share) {
                                try {
                                    await navigator.share({ title: file.name, text: `Check out this file: ${file.name}`, url: file.url });
                                } catch (shareError) {
                                    console.error("Error sharing file:", shareError);
                                    toast({ title: "Share Error", description: "Could not share file.", variant: "destructive"});
                                }
                            } else {
                                navigator.clipboard.writeText(file.url);
                                toast({ title: "Link Copied", description: "File link copied to clipboard." });
                            }
                        }}
                        title="Share File"
                    >
                      <Share2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleFileDelete(file.id, file.name)} title="Delete File">
                      <Trash2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  const renderUploadModal = () => (
    <Dialog open={activeModal === 'upload'} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent 
        className="max-w-lg max-h-[80vh] flex flex-col"
        onDragOver={handleDragOver} 
        onDrop={handleDropOnUploadArea}
      >
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        {showSuccessConfetti && <ReactConfetti width={width} height={height} numberOfPieces={100} recycle={false} className="!fixed !z-[100]" />}
        <div className="flex-1 space-y-4 py-4 overflow-y-auto pr-1">
          <div 
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary transition-colors min-h-[150px]"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          >
            <label htmlFor="lead-file-upload-input-modal" className="sr-only">Select files to upload</label>
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Drag & drop files here, or click to select</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Max file size: 10MB (Example)</p>
            <input type="file" id="lead-file-upload-input-modal" ref={fileInputRef} onChange={handleFileSelectForUpload} multiple className="hidden" aria-hidden="true" />
          </div>

          {filesToUpload.length > 0 && (
            <ScrollArea className="max-h-[200px] pr-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files ({filesToUpload.length}):</p>
                {filesToUpload.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-md border text-sm">
                    <div className="flex-1 min-w-0">
                        <label htmlFor={`rename-file-input-${index}`} className="sr-only">Rename file: {file.name}</label>
                        <Input 
                            type="text" 
                            id={`rename-file-input-${index}`}
                            defaultValue={file.name} 
                            aria-label={`Rename file: ${file.name}`} 
                            title={`Rename file: ${file.name}`}
                            onBlur={(e) => {
                                const newName = e.target.value.trim();
                                if (newName && newName !== file.name) {
                                    const updatedFile = new File([file], newName, { type: file.type, lastModified: file.lastModified });
                                    setFilesToUpload(prev => prev.map((f, i) => i === index ? updatedFile : f));
                                } else if (!newName) {
                                    // If name is cleared, revert to original name for display if needed, or handle as error
                                    // For now, let input be empty, actual file object still has old name or last valid name
                                    // Or, force a name by resetting e.target.value = file.name;
                                }
                            }}
                            className="h-8 text-xs p-1.5"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 shrink-0" onClick={() => setFilesToUpload(prev => prev.filter((f, i) => i !== index))} >
                      <XIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="mt-auto pt-4">
          <DialogClose asChild><Button variant="outline" onClick={closeModal} disabled={isUploading}>Cancel</Button></DialogClose>
          <Button onClick={handleActualUpload} disabled={filesToUpload.length === 0 || isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} 
            Upload {filesToUpload.length > 0 ? `(${filesToUpload.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // Placeholder for Take Photo Modal
  const renderCameraModal = () => (
    <Dialog open={activeModal === 'camera'} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Take Photo</DialogTitle></DialogHeader>
        <div className="py-10 text-center">
          <p>Camera functionality will be implemented here.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setActiveModal('view')}>
          <Eye className="h-5 w-5 mr-2" /> View Files ({files.length})
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={openUploadModal}>
          <Upload className="h-5 w-5 mr-2" /> Upload New File
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setActiveModal('camera')} disabled>
          <Camera className="h-5 w-5 mr-2" /> Take Photo
        </Button>
      </div>

      {renderViewFilesModal()}
      {renderUploadModal()}
      {renderCameraModal()} 
    </div>
  );
}
