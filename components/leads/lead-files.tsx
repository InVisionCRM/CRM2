"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLeadFiles } from "@/hooks/use-lead-files"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Eye, Camera, Trash2, Share2, XIcon, Loader2, FileIcon as LucideFileIcon, FolderOpen, FolderPlus } from "lucide-react"
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { getLeadDriveFolderIdServerAction, ensureLeadDriveFolderServerAction, fetchDriveFilesServerAction } from "@/app/actions/lead-drive-actions"; // Added fetchDriveFilesServerAction
// We will need react-camera-pro if we proceed with its implementation
// import { Camera as ReactCameraPro } from "react-camera-pro";

interface LeadFilesProps {
  leadId: string
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime: string;
  size?: string;
  // Source identifier for UI differentiation
  source: 'drive';
}

// Combined file type for unified display
type CombinedFile = DriveFile | (ReturnType<typeof useLeadFiles>['files'][0] & { source: 'local' });

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
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [isLoadingDriveLink, setIsLoadingDriveLink] = useState(true);
  const [isCreatingDriveFolder, setIsCreatingDriveFolder] = useState(false);
  
  // New state for Drive files
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [driveFilesError, setDriveFilesError] = useState<Error | null>(null);

  // Combined files for unified display
  const combinedFiles = React.useMemo(() => {
    const localWithSource = files.map(file => ({
      ...file,
      source: 'local' as const
    }));
    
    return [...localWithSource, ...driveFiles].sort((a, b) => {
      // Sort by upload/modified date, most recent first
      const dateA = a.source === 'local' ? new Date(a.uploadedAt).getTime() : new Date(a.modifiedTime).getTime();
      const dateB = b.source === 'local' ? new Date(b.uploadedAt).getTime() : new Date(b.modifiedTime).getTime();
      return dateB - dateA;
    });
  }, [files, driveFiles]);

  useEffect(() => {
    const fetchDriveId = async () => {
      if (!leadId) {
        setIsLoadingDriveLink(false);
        setDriveFolderId(null);
        return;
      }
      setIsLoadingDriveLink(true);
      try {
        // Now calling the imported server action
        const folderId = await getLeadDriveFolderIdServerAction(leadId); 
        setDriveFolderId(folderId);
        if (folderId) {
          console.log(`Drive folder ID loaded for lead ${leadId}: ${folderId}`);
        } else {
          console.log(`No Drive folder ID found for lead ${leadId}`);
        }
      } catch (error) {
        console.error("Failed to fetch Drive folder ID from server action:", error);
        toast({ title: "Error", description: "Could not load Drive folder link.", variant: "destructive" });
        setDriveFolderId(null);
      } finally {
        setIsLoadingDriveLink(false);
      }
    };
    fetchDriveId();
  }, [leadId]);

  // New effect to fetch Drive files when folder ID is available
  useEffect(() => {
    const fetchDriveFilesData = async () => {
      if (!driveFolderId) return;
      
      setIsLoadingDriveFiles(true);
      setDriveFilesError(null);
      
      try {
        const driveFilesResult = await fetchDriveFilesServerAction(driveFolderId);
        if (driveFilesResult.success) {
          setDriveFiles(driveFilesResult.files);
        } else {
          throw new Error(driveFilesResult.message || "Failed to fetch Drive files");
        }
      } catch (error: any) {
        console.error("Error fetching Drive files:", error);
        setDriveFilesError(error instanceof Error ? error : new Error(String(error)));
        // Don't show toast here to avoid too many notifications
      } finally {
        setIsLoadingDriveFiles(false);
      }
    };
    
    fetchDriveFilesData();
  }, [driveFolderId]);

  const handleCreateDriveFolder = async () => {
    if (!leadId) {
      toast({ title: "Error", description: "Lead ID is missing.", variant: "destructive" });
      return;
    }
    setIsCreatingDriveFolder(true);
    try {
      const result = await ensureLeadDriveFolderServerAction(leadId);
      if (result.success && result.folderId) {
        setDriveFolderId(result.folderId);
        toast({ title: "Success", description: "Google Drive folder created and linked." });
        
        // Immediately fetch files from the newly created folder
        try {
          const filesResult = await fetchDriveFilesServerAction(result.folderId);
          if (filesResult.success) {
            setDriveFiles(filesResult.files);
          }
        } catch (fetchError) {
          console.error("Error fetching Drive files after folder creation:", fetchError);
        }
      } else {
        toast({ title: "Error", description: result.message || "Failed to create or link Google Drive folder.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Failed to create/ensure Drive folder from client:", error);
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsCreatingDriveFolder(false);
    }
  };

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
          fileInputRef.current.value = ""; // Reset file input
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

  // Helper function to get appropriate icon/thumbnail for a file
  const getFilePreview = (file: CombinedFile) => {
    if (file.source === 'local') {
      // Local file logic
      return file.type?.startsWith("image/") 
        ? <img src={file.url} alt={file.name} className="h-full w-full object-cover" /> 
        : <LucideFileIcon className="h-10 w-10 text-muted-foreground" />;
    } else {
      // Drive file logic
      if (file.mimeType.includes('image/') && file.thumbnailLink) {
        return <img src={file.thumbnailLink} alt={file.name} className="h-full w-full object-cover" />;
      }
      return <img src={file.iconLink || '/google-drive-icon.svg'} 
                 alt="Drive file" 
                 className="h-10 w-10 mx-auto" />;
    }
  };

  // Helper to get the file URL based on source
  const getFileUrl = (file: CombinedFile) => {
    return file.source === 'local' ? file.url : file.webViewLink;
  };

  const handleFileSizeDisplay = (file: CombinedFile) => {
    if (file.source === 'local') {
      return file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'N/A';
    } else {
      return file.size || 'N/A';
    }
  };

  // Updated render function for the view files modal to include Drive files
  const renderViewFilesModal = () => (
    <Dialog open={activeModal === 'view'} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>View Files</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          {(isLoadingFiles || isLoadingDriveFiles) && 
            <p className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2"/>
              Loading files...
            </p>}
          
          {(filesError || driveFilesError) && 
            <p className="text-red-500 text-center py-4">
              Error: {filesError?.message || driveFilesError?.message}
            </p>}
          
          {!isLoadingFiles && !isLoadingDriveFiles && !filesError && !driveFilesError && combinedFiles.length === 0 && (
            <p className="text-muted-foreground text-center py-10">No files available.</p>
          )}
          
          {!isLoadingFiles && !isLoadingDriveFiles && combinedFiles.length > 0 && (
            <ul className="space-y-3">
              {combinedFiles.map((file, index) => {
                const isLocalFile = file.source === 'local';
                return (
                  <li key={`${file.source}-${file.id}-${index}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-10 w-10">
                        {getFilePreview(file)}
                        {!isLocalFile && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <img src="/google-drive-icon.svg" alt="Google Drive" className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isLocalFile ? 
                            `Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}` : 
                            `Modified: ${new Date(file.modifiedTime).toLocaleDateString()}`} | 
                          Size: {handleFileSizeDisplay(file)}
                          {!isLocalFile && <span className="ml-1 text-blue-500">• Drive</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 ml-2 shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(getFileUrl(file), '_blank')} 
                        title="View File"
                      >
                        <Eye className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          const shareUrl = getFileUrl(file);
                          if (navigator.share) {
                            try {
                              await navigator.share({ 
                                title: file.name, 
                                text: `Check out this file: ${file.name}`, 
                                url: shareUrl 
                              });
                            } catch (shareError) {
                              console.error("Error sharing file:", shareError);
                              toast({ 
                                title: "Share Error", 
                                description: "Could not share file.", 
                                variant: "destructive"
                              });
                            }
                          } else {
                            navigator.clipboard.writeText(shareUrl);
                            toast({ 
                              title: "Link Copied", 
                              description: "File link copied to clipboard." 
                            });
                          }
                        }}
                        title="Share File"
                      >
                        <Share2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Share</span>
                      </Button>
                      {isLocalFile && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleFileDelete(file.id, file.name)} 
                          title="Delete File"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Delete</span>
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
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
                                    const renamedFile = new File([file], newName, { type: file.type, lastModified: file.lastModified });
                                    setFilesToUpload(prev => prev.map((f, i) => i === index ? renamedFile : f));
                                }
                            }}
                            className="h-8 text-xs p-1.5"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setFilesToUpload(prev => prev.filter((_, i) => i !== index))}>
                        <XIcon className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter className="mt-auto pt-4">
          <DialogClose asChild>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleActualUpload} disabled={isUploading || filesToUpload.length === 0}>
            {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Uploading...</> : `Upload ${filesToUpload.length} File(s)`}
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

  // Helper function to determine if we're loading or have an error
  const isLoading = isLoadingFiles || isLoadingDriveFiles;
  const hasError = filesError || driveFilesError;

  return (
    <div className="p-4 bg-background rounded-lg shadow">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-xl font-semibold text-foreground">Lead Files</h2>
        <div className="flex flex-wrap gap-2">
          {/* Google Drive Folder Button */}
          {isLoadingDriveLink ? (
            <Button variant="outline" disabled className="bg-muted hover:bg-muted">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading Drive Link...
            </Button>
          ) : driveFolderId ? (
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://drive.google.com/drive/folders/${driveFolderId}`, '_blank', 'noopener,noreferrer')}
              className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
            >
              <FolderOpen className="h-4 w-4 mr-2" /> Open Drive Folder
            </Button>
          ) : (
            <Button 
              variant="default"
              onClick={handleCreateDriveFolder}
              disabled={isCreatingDriveFolder}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isCreatingDriveFolder ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Folder...</>
              ) : (
                <><FolderPlus className="h-4 w-4 mr-2" /> Create Drive Folder</>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => setActiveModal('view')} className="bg-muted hover:bg-muted/80">
            <Eye className="h-4 w-4 mr-2" /> View All ({combinedFiles.length})
          </Button>
          <Button variant="default" onClick={openUploadModal} className="bg-primary text-black hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" /> Upload Files
          </Button>
          {/* <Button variant="outline" onClick={() => setActiveModal('camera')} className="bg-muted hover:bg-muted/80">
            <Camera className="h-4 w-4 mr-2" /> Use Camera
          </Button> */}
        </div>
      </div>

      {/* Simplified display area, modals handle detailed views/actions */}
      {isLoading ? (
        <div className="text-center py-5"><Loader2 className="h-5 w-5 animate-spin inline mr-2 text-muted-foreground"/>Loading files...</div>
      ) : hasError ? (
        <div className="text-center py-5 text-destructive">Error loading files: {filesError?.message || driveFilesError?.message}</div>
      ) : combinedFiles.length === 0 ? (
        <div className="text-center py-10 px-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
          <LucideFileIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No files available for this lead yet.</p>
          <p className="text-sm text-muted-foreground/80 mt-1">Use the "Upload Files" button to add documents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Display a few recent files or previews, full list in modal */}
          {combinedFiles.slice(0, 5).map((file, index) => {
            const isLocalFile = file.source === 'local';
            return (
              <div key={`${file.source}-${file.id}-${index}`} className="relative group p-2 border rounded-lg bg-card hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted rounded-md flex items-center justify-center mb-2 overflow-hidden">
                  {getFilePreview(file)}
                </div>
                <p className="text-xs font-medium truncate text-center text-card-foreground" title={file.name}>{file.name}</p>
                
                {/* Badge to indicate Google Drive files */}
                {!isLocalFile && (
                  <div className="absolute top-1 left-1 bg-white rounded-full p-0.5 shadow-sm">
                    <img src="/google-drive-icon.svg" alt="Google Drive" className="h-4 w-4" />
                  </div>
                )}
                
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => window.open(getFileUrl(file), '_blank')} 
                    title="View File"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
          {combinedFiles.length > 5 && (
            <div 
                className="aspect-square border-2 border-dashed border-muted-foreground/20 rounded-md flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveModal('view')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('view'); }}
            >
                <Eye className="h-8 w-8 text-muted-foreground mb-1"/>
                <p className="text-xs text-muted-foreground">View All ({combinedFiles.length})</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {renderViewFilesModal()}
      {renderUploadModal()}
      {/* {renderCameraModal()} */}
    </div>
  );
}
