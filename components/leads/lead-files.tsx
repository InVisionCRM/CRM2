"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Loader2, Eye, Trash2, Download, FileIcon as LucideFileIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useLeadFiles } from "@/hooks/use-lead-files"
import { useWindowSize } from "@/hooks/use-window-size"
import ReactConfetti from "react-confetti"

interface LeadFilesProps {
  leadId: string
}

type ModalType = null | 'view' | 'upload'

export function LeadFiles({ leadId }: LeadFilesProps) {
  const { 
    files, 
    isLoading, 
    error, 
    refreshFiles, 
    deleteFile, 
  } = useLeadFiles(leadId);
  
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessConfetti, setShowSuccessConfetti] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

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
    
    setIsUploading(true);
    const initialProgress: {[key: string]: number} = {};
    filesToUpload.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);
    
    let allSucceeded = true;
    
    // Use new shared drive upload for all files
    for (const file of filesToUpload) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 5 }));

        // Create FormData with file and metadata for shared drive
        const formData = new FormData();
        formData.append('file', file);
        formData.append('leadId', leadId);
        formData.append('fileType', 'file'); // Default to 'file' type

        // Upload to shared drive
        const uploadResponse = await fetch('/api/files/upload-to-shared-drive', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

        if (!uploadResponse.ok) {
          let errorData;
          try {
            errorData = await uploadResponse.json();
          } catch (e) {
            const errorText = await uploadResponse.text();
            errorData = { error: 'Upload failed. Server response: ' + (errorText || uploadResponse.statusText) };
          }
          throw new Error(errorData.error || `Failed to upload file. Status: ${uploadResponse.status}`);
        }

        const result = await uploadResponse.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Upload failed without error details');
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      } catch (error) {
        allSucceeded = false;
        console.error('Error uploading to shared drive:', error);
        toast({
          title: `Upload Failed: ${file.name}`,
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }
    
    setIsUploading(false);
    setUploadProgress({});
    
    if (allSucceeded && filesToUpload.length > 0) {
      toast({
        title: "Upload Successful",
        description: `${filesToUpload.length} file(s) uploaded to Google Drive.`,
      });
      setShowSuccessConfetti(true);
      setTimeout(() => setShowSuccessConfetti(false), 4000); 
      closeModal(); 
    }    
    
    // Refresh files to show new uploads
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
  const getFilePreview = (file: any) => {
    if (file.thumbnailLink) {
      return <img src={file.thumbnailLink} alt={file.name} className="h-full w-full object-cover" />;
    }
    if (file.type?.startsWith("image/")) {
      return <img src={file.url} alt={file.name} className="h-full w-full object-cover" />; 
    }
    return <LucideFileIcon className="h-10 w-10 text-muted-foreground" />;
  };

  const handleFileDownload = async (file: any) => {
    try {
      // For shared drive files, use webContentLink for direct download
      const downloadUrl = file.webContentLink || file.url;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the file.",
        variant: "destructive",
      });
    }
  };

  // Updated render function for the view files modal
  const renderViewFilesModal = () => (
    <Dialog open={activeModal === 'view'} onOpenChange={(isOpen) => !isOpen && closeModal()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>View Files</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          {isLoading && 
            <p className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2"/>
              Loading files...
            </p>}
          
          {error && 
            <p className="text-red-500 text-center py-4">
              Error loading files: {error.message}
            </p>}
          
          {!isLoading && !error && files.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No files found.</p>
          )}
          
          {!isLoading && !error && files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
              {files.map((file) => (
                <Card key={file.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="aspect-square mb-2 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                      {getFilePreview(file)}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'N/A'} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileDownload(file)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileDelete(file.id, file.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
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
          {!isUploading ? (
            <>
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
                <p className="text-xs text-muted-foreground/80 mt-1">Max file size: 100MB</p>
                <input type="file" id="lead-file-upload-input-modal" ref={fileInputRef} onChange={handleFileSelectForUpload} multiple className="hidden" aria-hidden="true" />
              </div>
              
              {filesToUpload.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Files to upload:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filesToUpload.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span className="truncate flex-1 mr-2">{file.name}</span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setFilesToUpload(prev => prev.filter((_, i) => i !== index))}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-center">Uploading files to Google Drive...</p>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{fileName}</span>
                    <span className={progress === -1 ? "text-red-500" : "text-muted-foreground"}>
                      {progress === -1 ? "Failed" : `${progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress === -1 ? "bg-red-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(0, progress)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="mt-auto pt-4">
          <DialogClose asChild>
            <Button variant="outline" onClick={closeModal} disabled={isUploading}>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleActualUpload} 
            disabled={isUploading || filesToUpload.length === 0}
          >
            {isUploading ? 
              <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Uploading...</> : 
              `Upload ${filesToUpload.length} File(s)`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Files</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveModal('view')}>
            <Eye className="h-4 w-4 mr-2" />
            View Files ({files.length})
          </Button>
          <Button size="sm" onClick={openUploadModal} className="bg-[#59ff00] text-black hover:bg-[#59ff00]/90">
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading files...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Error loading files: {error.message}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No files uploaded yet.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} stored in Google Drive
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {files.slice(0, 8).map((file) => (
                <div key={file.id} className="aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center group hover:bg-muted/80 transition-colors">
                  {getFilePreview(file)}
                </div>
              ))}
              {files.length > 8 && (
                <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                  +{files.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {renderViewFilesModal()}
      {renderUploadModal()}
    </Card>
  );
} 