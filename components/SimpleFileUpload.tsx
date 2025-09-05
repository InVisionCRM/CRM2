"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { motion } from 'motion/react';

interface SimpleFileUploadProps {
  leadId: string;
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  buttonText?: string;
  disabled?: boolean;
}

export function SimpleFileUpload({
  leadId,
  onUploadSuccess,
  onUploadError,
  className,
  buttonText = "Upload Files",
  disabled = false
}: SimpleFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [filesWithNames, setFilesWithNames] = useState<{file: File, customName: string, id: string}[]>([]);
  const [showFilenameDialog, setShowFilenameDialog] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  };

  const getFinalFileName = (fileWithName: {file: File, customName: string}) => {
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

  const handleFileSelect = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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
    setShowFilenameDialog(true);
  };

  const handleUpload = async () => {
    if (filesWithNames.length === 0) return;

    setIsUploading(true);
    setShowFilenameDialog(false);
    const results: any[] = [];

    try {
      for (let i = 0; i < filesWithNames.length; i++) {
        const fileWithName = filesWithNames[i];
        setCurrentUploadIndex(i);
        
        const formData = new FormData();
        formData.append('file', fileWithName.file);
        formData.append('leadId', leadId);
        formData.append('fileType', 'document');
        formData.append('category', 'general');
        
        // Add custom filename if it has been modified
        const finalFileName = getFinalFileName(fileWithName);
        if (finalFileName && finalFileName !== fileWithName.file.name) {
          formData.append('customFileName', finalFileName);
        }

        const response = await fetch('/api/files/upload-dual', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || `Upload failed for ${finalFileName} with status ${response.status}`);
        }

        if (result.success) {
          results.push(result);
        } else {
          throw new Error(result.message || `Upload failed for ${finalFileName}`);
        }
      }

      // All files uploaded successfully
      toast({
        title: "Files Uploaded",
        description: `${filesWithNames.length} files uploaded successfully`,
      });
      onUploadSuccess?.(results);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setFilesWithNames([]);
      setCurrentUploadIndex(0);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setShowFilenameDialog(false);
    setFilesWithNames([]);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        onClick={handleFileSelect}
        disabled={disabled || isUploading}
        className={cn("", className)}
      >
        {isUploading ? (
          <div className="flex items-center">
            <div className="relative w-4 h-4 mr-2">
              <div className="absolute inset-0 border border-white/30 rounded-full" />
              <motion.div 
                className="absolute inset-0 border-2 border-white border-r-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs leading-tight">
                Uploading {currentUploadIndex + 1}/{filesWithNames.length}
              </span>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="*/*"
      />

      {/* Filename Editor Dialog */}
      <Dialog open={showFilenameDialog} onOpenChange={setShowFilenameDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Filenames ({filesWithNames.length} files)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
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

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={filesWithNames.length === 0 || filesWithNames.some(f => !f.customName.trim())}
            >
              Upload {filesWithNames.length} Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}