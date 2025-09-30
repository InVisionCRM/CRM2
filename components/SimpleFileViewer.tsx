"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { X, Download, ExternalLink, File, FileText, Image as ImageIcon, FileSpreadsheet, FileVideo, FileAudio, Archive, Code, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  category?: string;
  url: string;
  uploadedAt: string;
}

interface SimpleFileViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onFileDeleted?: () => void;
}

export function SimpleFileViewer({ 
  open, 
  onOpenChange, 
  leadId,
  onFileDeleted 
}: SimpleFileViewerProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/files`);
      const data = await response.json();
      
      if (response.ok) {
        setFiles(data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load files",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeletingFileId(fileId);
    try {
      const response = await fetch('/api/files/delete-drive-file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, leadId })
      });

      const data = await response.json();
      
      if (data.success) {
        setFiles(files.filter(f => f.id !== fileId));
        onFileDeleted?.();
        toast({
          title: "File Deleted",
          description: `"${fileName}" has been deleted successfully`
        });
      } else {
        throw new Error(data.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setDeletingFileId(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="h-8 w-8 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="h-8 w-8 text-orange-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-8 w-8 text-yellow-500" />;
    if (mimeType.includes('code') || mimeType.includes('script')) return <Code className="h-8 w-8 text-gray-500" />;
    return <File className="h-8 w-8 text-gray-400" />;
  };

  const getThumbnailUrl = (file: FileData) => {
    if (!file.blobUrl) return null;
    
    // For images, use Vercel Blob's built-in optimization
    if (file.type.startsWith('image/')) {
      return `${file.blobUrl}?w=150&h=150&fit=cover`;
    }
    
    // For PDFs, we could potentially use PDF thumbnail generation
    // but for now, we'll just show the PDF icon
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open, leadId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Lead Files</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 text-black"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-700">Loading files...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700">No files found for this lead</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => {
                const thumbnailUrl = getThumbnailUrl(file);
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    {/* Thumbnail/Icon */}
                    <div className="flex justify-center mb-3 h-24 rounded-md items-center bg-gray-50">
                      {thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={file.name}
                          width={150}
                          height={150}
                          className="max-h-24 max-w-24 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            // Fallback to icon if thumbnail fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={thumbnailUrl ? 'hidden' : ''}>
                        {getFileIcon(file.type)}
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="text-center">
                      <h3 className="text-black mb-2 text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">{formatFileSize(file.size)}</p>
                      <p className="text-xs text-gray-600 mb-3">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-white text-black border-gray-300"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-white text-black border-gray-300"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.blobUrl || file.url;
                          link.download = file.name;
                          link.click();
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2 bg-white text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(file.id, file.name)}
                        disabled={deletingFileId === file.id}
                      >
                        {deletingFileId === file.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>{files.length} file{files.length !== 1 ? 's' : ''} total</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFiles}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}