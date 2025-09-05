"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, AlertCircle, Upload, Cloud, Database, X, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { nanoid } from 'nanoid';

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onUploadSuccess?: (result: any) => void;
}

interface UploadProgress {
  stage: 'idle' | 'blob' | 'drive' | 'database' | 'complete' | 'error';
  progress: number;
  message: string;
  currentFile?: string;
  fileProgress?: number; // 0-100 for current file
}

interface FileWithCustomName {
  file: File;
  customName: string;
  id: string;
}

export function FileUploadModal({ 
  open, 
  onOpenChange, 
  leadId, 
  onUploadSuccess 
}: FileUploadModalProps) {
  const [filesWithNames, setFilesWithNames] = useState<FileWithCustomName[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0);
  const { toast } = useToast();

  const resetState = () => {
    setFilesWithNames([]);
    setUploadProgress({ stage: 'idle', progress: 0, message: '' });
    setIsUploading(false);
    setUploadResults([]);
    setCurrentUploadIndex(0);
  };

  const handleFileChange = (files: File[]) => {
    setUploadResults([]);
    // Create FileWithCustomName objects for each file
    const newFilesWithNames = files.map(file => {
      const originalName = file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const nameWithoutExtension = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
      
      return {
        file,
        customName: nameWithoutExtension,
        id: nanoid()
      };
    });
    
    setFilesWithNames(newFilesWithNames);
  };

  const getFileExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  };

  const getFinalFileName = (fileWithName: FileWithCustomName) => {
    const extension = getFileExtension(fileWithName.file.name);
    return fileWithName.customName.trim() + extension;
  };

  const updateCustomName = (id: string, newName: string) => {
    setFilesWithNames(prev => 
      prev.map(f => f.id === id ? { ...f, customName: newName } : f)
    );
  };

  const removeFile = (id: string) => {
    setFilesWithNames(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (filesWithNames.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const results: any[] = [];
    
    try {
      for (let i = 0; i < filesWithNames.length; i++) {
        const fileWithName = filesWithNames[i];
        const { file } = fileWithName;
        
        setCurrentUploadIndex(i);
        const fileNumber = i + 1;
        const totalFiles = filesWithNames.length;
        const baseProgress = (i * 100) / totalFiles;
        const fileProgressStep = 100 / totalFiles;
        
        const finalFileName = getFinalFileName(fileWithName);
        
        // Stage 1: Starting upload
        setUploadProgress({
          stage: 'blob',
          progress: baseProgress,
          fileProgress: 0,
          currentFile: finalFileName,
          message: `Preparing ${finalFileName}...`
        });
        await new Promise(resolve => setTimeout(resolve, 100));

        // Stage 2: Uploading to Vercel Blob
        setUploadProgress({
          stage: 'blob',
          progress: baseProgress + (fileProgressStep * 0.2),
          fileProgress: 20,
          currentFile: finalFileName,
          message: `Uploading to Vercel Blob...`
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('leadId', leadId);
        formData.append('fileType', 'document');
        formData.append('category', 'general');
        
        // Add custom filename if it has been modified
        if (finalFileName && finalFileName !== file.name) {
          formData.append('customFileName', finalFileName);
        }

        // Stage 3: Processing
        setUploadProgress({
          stage: 'blob',
          progress: baseProgress + (fileProgressStep * 0.4),
          fileProgress: 40,
          currentFile: finalFileName,
          message: `Processing file...`
        });

        const response = await fetch('/api/files/upload-dual', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${finalFileName} with status ${response.status}`);
        }

        // Stage 4: Uploading to Google Drive
        setUploadProgress({
          stage: 'drive',
          progress: baseProgress + (fileProgressStep * 0.7),
          fileProgress: 70,
          currentFile: finalFileName,
          message: `Syncing to Google Drive...`
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || `Upload failed for ${finalFileName}`);
        }

        results.push(result);
        
        // Stage 5: Finalizing
        setUploadProgress({
          stage: 'database',
          progress: baseProgress + (fileProgressStep * 0.9),
          fileProgress: 90,
          currentFile: finalFileName,
          message: `Finalizing...`
        });

        await new Promise(resolve => setTimeout(resolve, 200));

        // File complete
        setUploadProgress({
          stage: 'database',
          progress: baseProgress + fileProgressStep,
          fileProgress: 100,
          currentFile: finalFileName,
          message: `${finalFileName} uploaded successfully`
        });

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Stage 5: Complete
      setUploadProgress({
        stage: 'complete',
        progress: 100,
        message: `All ${filesWithNames.length} files uploaded successfully!`
      });

      setUploadResults(results);
      onUploadSuccess?.(results);

      toast({
        title: "🎉 Upload Successful!",
        description: `${filesWithNames.length} files uploaded to Vercel Blob and Google Drive`,
      });

    } catch (error) {
      setUploadProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed'
      });

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      resetState();
      onOpenChange(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Upload File</DialogTitle>
            {!isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Component */}
          {uploadResults.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <FileUpload onChange={handleFileChange} />
            </div>
          )}

          {/* Multiple Files Editor */}
          {filesWithNames.length > 0 && uploadResults.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Selected Files ({filesWithNames.length})
                </Label>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setFilesWithNames([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-3">
                {filesWithNames.map((fileWithName) => (
                  <div key={fileWithName.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">
                          {fileWithName.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(fileWithName.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(fileWithName.id)}
                        disabled={isUploading}
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`filename-${fileWithName.id}`} className="text-xs font-medium">
                        Custom Filename
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            id={`filename-${fileWithName.id}`}
                            value={fileWithName.customName}
                            onChange={(e) => updateCustomName(fileWithName.id, e.target.value)}
                            placeholder="Enter custom filename"
                            className="pr-16 text-sm"
                            disabled={isUploading}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            {getFileExtension(fileWithName.file.name)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Final: <span className="font-medium">{getFinalFileName(fileWithName)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Minimalistic Progress Section */}
          {(isUploading || uploadProgress.stage !== 'idle') && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/5 backdrop-blur-sm rounded-xl" />
              
              {/* Content */}
              <div className="relative p-6 space-y-4">
                {/* Current File Info */}
                {uploadProgress.currentFile && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-black/80 truncate">
                      {uploadProgress.currentFile}
                    </p>
                    <p className="text-xs text-black/50 mt-1">
                      File {currentUploadIndex + 1} of {filesWithNames.length}
                    </p>
                  </div>
                )}

                {/* Main Progress Bar */}
                <div className="space-y-2">
                  <div className="relative h-1 bg-black/10 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-black/60 rounded-full"
                      style={{ width: `${uploadProgress.progress}%` }}
                      animate={{ width: `${uploadProgress.progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  
                  {/* File Progress Bar (if available) */}
                  {uploadProgress.fileProgress !== undefined && (
                    <div className="relative h-0.5 bg-black/5 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-black/30 rounded-full"
                        style={{ width: `${uploadProgress.fileProgress}%` }}
                        animate={{ width: `${uploadProgress.fileProgress}%` }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between text-xs">
                  <span className={uploadProgress.stage === 'error' ? 'text-red-600' : 'text-black/60'}>
                    {uploadProgress.message}
                  </span>
                  <span className="text-black/40 font-mono">
                    {Math.round(uploadProgress.progress)}%
                  </span>
                </div>

                {/* Minimal Stage Dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {['blob', 'drive', 'database', 'complete'].map((stage, index) => {
                    const isActive = uploadProgress.stage === stage;
                    const isComplete = index <= ['blob', 'drive', 'database', 'complete'].indexOf(uploadProgress.stage);
                    
                    return (
                      <motion.div
                        key={stage}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isComplete
                            ? 'bg-black/60 scale-110'
                            : isActive
                            ? 'bg-black/40 scale-125'
                            : 'bg-black/10'
                        }`}
                        animate={isActive ? { 
                          scale: [1, 1.2, 1],
                          opacity: [0.4, 0.8, 0.4]
                        } : {}}
                        transition={{ 
                          duration: 1.2, 
                          repeat: isActive ? Infinity : 0,
                          ease: "easeInOut"
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-green-800">Upload Successful!</h3>
              </div>
              
              <div className="space-y-3 text-sm text-green-700">
                <div>
                  <strong>Files Uploaded:</strong> {uploadResults.length}
                </div>
                <div>
                  <strong>Storage:</strong> Vercel Blob (primary) + Google Drive (backup)
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {uploadResults.map((result, index) => (
                    <div key={index} className="bg-green-100 rounded p-2">
                      <div className="font-medium">
                        {result.data?.name || `File ${index + 1}`}
                      </div>
                      <div className="text-xs">
                        Size: {((result.data?.size || 0) / 1024).toFixed(1)} KB
                        {result.data?.blobUrl && (
                          <>
                            {' • '}
                            <a 
                              href={result.data.blobUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {uploadResults.length === 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={filesWithNames.length === 0 || isUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading 
                    ? `Uploading ${currentUploadIndex + 1}/${filesWithNames.length}...` 
                    : `Upload ${filesWithNames.length} File${filesWithNames.length !== 1 ? 's' : ''}`
                  }
                </Button>
              </>
            )}
            
            {uploadResults.length > 0 && (
              <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}