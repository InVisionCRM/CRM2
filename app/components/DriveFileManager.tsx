"use client";

import { useState } from "react";
import { useGoogleDrive } from "@/lib/hooks/useGoogleDrive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { MoreVertical, Upload, Download, Trash2, File } from "lucide-react";
import type { DriveFile } from "@/types/drive";

export function DriveFileManager() {
  const { files, isLoading, isError, error, uploadFile, downloadFile, deleteFile } = useGoogleDrive();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      if (result.success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: DriveFile) => {
    try {
      const result = await downloadFile(file.id);
      if (result.success && result.data) {
        // Create a blob and download the file
        const blob = new Blob([result.data], { type: file.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "File downloaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to download file",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: DriveFile) => {
    try {
      const result = await deleteFile(file.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <p className="text-red-500">Error loading files: {error?.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-white/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold text-white">Files</CardTitle>
        <div className="flex items-center space-x-2">
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isUploading}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white/70">Name</TableHead>
              <TableHead className="text-white/70">Type</TableHead>
              <TableHead className="text-white/70">Created</TableHead>
              <TableHead className="text-white/70 w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files?.map((file) => (
              <TableRow key={file.id} className="border-white/10">
                <TableCell className="font-medium text-white">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-white/70" />
                    <span>{file.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-white/70">{file.mimeType}</TableCell>
                <TableCell className="text-white/70">
                  {new Date(file.createdTime).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/10"
                      >
                        <MoreVertical className="h-4 w-4 text-white/70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 border-white/20">
                      <DropdownMenuItem
                        onClick={() => handleDownload(file)}
                        className="text-white/90 hover:bg-white/10 cursor-pointer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(file)}
                        className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {(!files || files.length === 0) && (
              <TableRow className="border-white/10">
                <TableCell colSpan={4} className="text-center text-white/50 py-8">
                  No files found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 