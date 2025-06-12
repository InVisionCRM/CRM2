"use client";

import { useState } from "react";
import { useGoogleDrive } from "@/lib/hooks/useGoogleDrive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  MoreVertical,
  Upload,
  Download,
  Trash2,
  File,
  FolderPlus,
  Folder,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
  Settings,
  HelpCircle,
  Grid2X2,
  List
} from "lucide-react";
import type { DriveFile } from "@/types/drive";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DriveFileManager() {
  const {
    files,
    isLoading,
    isError,
    error,
    uploadFile,
    downloadFile,
    deleteFile,
    createFolder,
    deleteFolder,
    folderPath,
    navigateToFolder,
    navigateBack,
    currentFolderId,
  } = useGoogleDrive();

  const [isUploading, setIsUploading] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<DriveFile | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(file, { folderId: currentFolderId });
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

  const handleDeleteFolderClick = (folder: DriveFile) => {
    setFolderToDelete(folder);
    setShowDeleteFolderDialog(true);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    setIsDeletingFolder(true);
    try {
      const result = await deleteFolder(folderToDelete.id);
      if (result.success) {
        toast({
          title: "Folder Deleted",
          description: `"${folderToDelete.name}" moved to Trash.`,
        });
      } else {
        toast({
          title: "Error Deleting Folder",
          description: result.message || "Failed to delete folder.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the folder.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingFolder(false);
      setShowDeleteFolderDialog(false);
      setFolderToDelete(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingFolder(true);
    try {
      const result = await createFolder(newFolderName.trim(), { parentId: currentFolderId });
      if (result.success) {
        toast({
          title: "Success",
          description: "Folder created successfully",
        });
        setShowNewFolderDialog(false);
        setNewFolderName("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create folder",
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
      setIsCreatingFolder(false);
    }
  };

  const handleFolderClick = async (folder: DriveFile, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (folder.mimeType !== 'application/vnd.google-apps.folder') {
      return;
    }

    try {
      await navigateToFolder(folder);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to open folder",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-500/10 p-4 rounded-lg">
        <p className="text-red-500">Error loading files: {error?.message}</p>
      </div>
    );
  }

  const renderDeleteFolderDialog = () => (
    <Dialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
        </DialogHeader>
        {folderToDelete && (
          <p className="py-4">
            Are you sure you want to move the folder "{folderToDelete.name}" to Trash?
          </p>
        )}
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowDeleteFolderDialog(false);
              setFolderToDelete(null);
            }}
            disabled={isDeletingFolder}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={confirmDeleteFolder} 
            disabled={isDeletingFolder}
          >
            {isDeletingFolder ? "Deleting..." : "Move to Trash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Toolbar with Breadcrumbs and View Mode Toggle
  const renderToolbar = () => (
    <div className="flex items-center justify-between px-6 py-3 border-b">
      <div className="flex items-center text-sm text-gray-600">
        <Button variant="ghost" size="icon" onClick={() => navigateBack()} disabled={folderPath.length === 0} className="mr-1 disabled:opacity-50">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { /* Navigate to next, if history is kept */ }} disabled className="mr-2 disabled:opacity-50">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <span onClick={() => navigateToFolder({ id: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID_DEFAULT || 'root', name: 'My Drive', mimeType: 'application/vnd.google-apps.folder'} as DriveFile)} className="hover:underline cursor-pointer">
          My Drive
        </span>
        {folderPath.map((folder, index) => (
          <span key={folder.id} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            {index === folderPath.length - 1 ? (
              <span className="font-medium text-gray-700">{folder.name}</span>
            ) : (
              <span onClick={() => navigateToFolder(folder)} className="hover:underline cursor-pointer">
                {folder.name}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="flex items-center">
        <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('list')} className="mr-1">
          <List className="h-5 w-5" />
        </Button>
        <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode('grid')}>
          <Grid2X2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  // List View Renderer
  const renderListView = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-3 text-left font-medium text-gray-500 w-3/5">Name</th>
          <th className="p-3 text-left font-medium text-gray-500 w-1/5">Date Modified</th>
          <th className="p-3 text-left font-medium text-gray-500 w-1/5">Actions</th>
        </tr>
      </thead>
      <tbody>
        {(files || []).map((item) => (
          <tr key={item.id} className="border-b hover:bg-gray-50 group">
            <td 
              className={`p-3 flex items-center ${item.mimeType === 'application/vnd.google-apps.folder' ? 'cursor-pointer' : ''}`}
              onClick={(e) => {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                  handleFolderClick(item, e); // This is for direct row click, keep as is
                }
              }}
            >
              {item.mimeType === 'application/vnd.google-apps.folder' ? (
                <Folder className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
              ) : (
                <File className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
              )}
              <span className="truncate text-gray-700 group-hover:text-blue-600">{item.name}</span>
            </td>
            <td className="p-3 text-gray-500">{new Date(item.createdTime).toLocaleDateString()}</td>
            <td className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {item.mimeType === 'application/vnd.google-apps.folder' ? (
                    <DropdownMenuItem onSelect={() => navigateToFolder(item)} className="cursor-pointer">
                      Open
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => handleDownload(item)} className="cursor-pointer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {/* Delete options for LIST VIEW */}
                  {item.mimeType === 'application/vnd.google-apps.folder' ? (
                    <DropdownMenuItem onSelect={() => handleDeleteFolderClick(item)} className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-50">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Move to Trash
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => handleDelete(item)} className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-50">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete File
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Grid View Renderer
  const renderGridView = () => (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {(files || []).map((item) => (
        <div 
          key={item.id} 
          className="group relative flex flex-col items-center p-3 border rounded-lg hover:bg-blue-50 transition-colors duration-150 
            ${item.mimeType === 'application/vnd.google-apps.folder' ? 'cursor-pointer' : ''}"
          onClick={(e) => {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
              handleFolderClick(item, e); // This is for direct card click, keep as is
            }
          }}
        >
          {item.mimeType === 'application/vnd.google-apps.folder' ? (
            <Folder className="h-16 w-16 text-blue-500 mb-2" />
          ) : (
            <File className="h-16 w-16 text-gray-400 mb-2" />
          )}
          <span className="text-sm text-gray-700 text-center truncate w-full group-hover:text-blue-600">{item.name}</span>
          {/* Actions Menu for Grid View - Placed at top right, appears on hover */}
          <div className="absolute top-1 right-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {item.mimeType === 'application/vnd.google-apps.folder' ? (
                  <DropdownMenuItem onSelect={() => navigateToFolder(item)} className="cursor-pointer">
                    Open folder
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => handleDownload(item)} className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                {/* Delete options for GRID VIEW */}
                {item.mimeType === 'application/vnd.google-apps.folder' ? (
                  <DropdownMenuItem onSelect={() => handleDeleteFolderClick(item)} className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => handleDelete(item)} className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete File
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Navigation Bar */}
      <div className="flex items-center px-4 py-2 border-b">
        <div className="flex items-center flex-1">
          <img src="/google-drive-logo.png" alt="Drive" className="h-6 w-6 mr-2" />
          <span className="text-xl font-normal text-gray-800">Drive</span>
        </div>
        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search in Drive"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-60 p-3 border-r">
          <Button
            onClick={() => document.getElementById("file-upload")?.click()}
            className="w-full mb-2 bg-white hover:bg-gray-50 text-gray-800 border shadow-sm rounded-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            New
          </Button>
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <div className="space-y-1 mt-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <Home className="h-4 w-4 mr-3" />
              My Drive
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Toolbar */}
          {renderToolbar()}

          {/* Files List */}
          <div className="p-4">
            {viewMode === "list" ? renderListView() : renderGridView()}
          </div>
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Untitled folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renderDeleteFolderDialog()}
    </div>
  );
} 