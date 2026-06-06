"use client";

import { useState } from "react";
import { useSharedGoogleDrive } from "@/lib/hooks/useSharedGoogleDrive";
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
  } = useSharedGoogleDrive({
    folderId: "0ALLiVXNBCH8OUk9PVA", // Your specific folder ID
    fetchOnInit: true,
  });

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A4D65E]"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#EF5E73]/10 border border-[#EF5E73]/20 p-4 rounded-xl">
        <p className="text-[#EF5E73]">Error loading files: {error?.message}</p>
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
    <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(236,234,224,0.08)]">
      <div className="flex items-center text-sm text-[#A7B0A6]">
        <Button variant="ghost" size="icon" onClick={() => navigateBack()} disabled={folderPath.length === 0} className="mr-1 text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D] disabled:opacity-40">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { /* Navigate to next, if history is kept */ }} disabled className="mr-2 text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D] disabled:opacity-40">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <span onClick={() => navigateToFolder({ id: "0ALLiVXNBCH8OUk9PVA", name: 'Shared Drive', mimeType: 'application/vnd.google-apps.folder'} as DriveFile)} className="hover:text-[#ECEAE0] cursor-pointer transition-colors">
          Shared Drive
        </span>
        {folderPath.map((folder, index) => (
          <span key={folder.id} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-[#6E776E]" />
            {index === folderPath.length - 1 ? (
              <span className="font-medium text-[#ECEAE0]">{folder.name}</span>
            ) : (
              <span onClick={() => navigateToFolder(folder)} className="hover:text-[#ECEAE0] cursor-pointer transition-colors">
                {folder.name}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? "bg-[#1B231D] text-[#ECEAE0]" : "text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D]"}>
          <List className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? "bg-[#1B231D] text-[#ECEAE0]" : "text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D]"}>
          <Grid2X2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  // List View Renderer
  const renderListView = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[rgba(236,234,224,0.08)]">
          <th className="p-3 text-left font-medium text-[#6E776E] uppercase tracking-wide text-xs w-3/5">Name</th>
          <th className="p-3 text-left font-medium text-[#6E776E] uppercase tracking-wide text-xs w-1/5">Date Modified</th>
          <th className="p-3 text-left font-medium text-[#6E776E] uppercase tracking-wide text-xs w-1/5">Actions</th>
        </tr>
      </thead>
      <tbody>
        {(files || []).map((item) => (
          <tr key={item.id} className="border-b border-[rgba(236,234,224,0.08)] hover:bg-[#1B231D]/60 group transition-colors">
            <td
              className={`p-3 flex items-center ${item.mimeType === 'application/vnd.google-apps.folder' ? 'cursor-pointer' : ''}`}
              onClick={(e) => {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                  handleFolderClick(item, e); // This is for direct row click, keep as is
                }
              }}
            >
              {item.mimeType === 'application/vnd.google-apps.folder' ? (
                <Folder className="h-5 w-5 text-[#A4D65E] mr-3 flex-shrink-0" />
              ) : (
                <File className="h-5 w-5 text-[#6E776E] mr-3 flex-shrink-0" />
              )}
              <span className="truncate text-[#ECEAE0] group-hover:text-[#A4D65E] transition-colors">{item.name}</span>
            </td>
            <td className="p-3 text-[#A7B0A6]">{new Date(item.createdTime).toLocaleDateString()}</td>
            <td className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D]">
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
                    <DropdownMenuItem onSelect={() => handleDeleteFolderClick(item)} className="cursor-pointer text-[#EF5E73] focus:text-[#EF5E73] focus:bg-[#EF5E73]/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Move to Trash
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => handleDelete(item)} className="cursor-pointer text-[#EF5E73] focus:text-[#EF5E73] focus:bg-[#EF5E73]/10">
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
          className={`group relative flex flex-col items-center p-4 border border-[rgba(236,234,224,0.08)] rounded-xl bg-[#161D18] hover:bg-[#1B231D] hover:border-[rgba(236,234,224,0.14)] transition-all duration-150 ${item.mimeType === 'application/vnd.google-apps.folder' ? 'cursor-pointer' : ''}`}
          onClick={(e) => {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
              handleFolderClick(item, e); // This is for direct card click, keep as is
            }
          }}
        >
          {item.mimeType === 'application/vnd.google-apps.folder' ? (
            <Folder className="h-16 w-16 text-[#A4D65E] mb-2" strokeWidth={1.5} />
          ) : (
            <File className="h-16 w-16 text-[#6E776E] mb-2" strokeWidth={1.5} />
          )}
          <span className="text-sm text-[#ECEAE0] text-center truncate w-full">{item.name}</span>
          {/* Actions Menu for Grid View - Placed at top right, appears on hover */}
          <div className="absolute top-1 right-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D]">
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
                  <DropdownMenuItem onSelect={() => handleDeleteFolderClick(item)} className="cursor-pointer text-[#EF5E73] focus:text-[#EF5E73] focus:bg-[#EF5E73]/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => handleDelete(item)} className="cursor-pointer text-[#EF5E73] focus:text-[#EF5E73] focus:bg-[#EF5E73]/10">
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
    <div className="flex flex-col h-full bg-[#161D18] border border-[rgba(236,234,224,0.08)] rounded-2xl overflow-hidden shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)]">
      {/* Top Navigation Bar */}
      <div className="flex items-center px-5 py-3 border-b border-[rgba(236,234,224,0.08)]">
        <div className="flex items-center flex-1 gap-2">
          <Folder className="h-6 w-6 text-[#A4D65E]" strokeWidth={1.75} />
          <span className="text-xl font-semibold text-[#ECEAE0] tracking-tight">Shared Drive</span>
        </div>
        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-[#6E776E]" strokeWidth={2} />
            <Input
              placeholder="Search in Drive"
              className="w-full pl-10 pr-4 py-2 bg-[#1B231D] border border-[rgba(236,234,224,0.08)] text-[#ECEAE0] placeholder:text-[#6E776E] rounded-xl focus:border-[#A4D65E]/40 focus:ring-1 focus:ring-[#A4D65E]/30"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <Button variant="ghost" size="icon" className="text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D]">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#A7B0A6] hover:text-[#ECEAE0] hover:bg-[#1B231D]">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-60 p-4 border-r border-[rgba(236,234,224,0.08)]">
          <Button
            onClick={() => document.getElementById("file-upload")?.click()}
            className="w-full mb-3 bg-[#A4D65E] hover:bg-[#7FB23F] text-[#0F1311] font-semibold rounded-full shadow-sm"
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
              className="w-full justify-start text-[#ECEAE0] hover:bg-[#1B231D] rounded-full"
            >
              <Home className="h-4 w-4 mr-3 text-[#A4D65E]" />
              Shared Drive
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Toolbar */}
          {renderToolbar()}

          {/* Files List */}
          <div className="p-4">
            {files && files.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-10 w-10 text-[#6E776E] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-[#A7B0A6]">No files found in this folder</p>
                <p className="text-sm text-[#6E776E] mt-2">Total files: {files?.length || 0}</p>
              </div>
            ) : (
              viewMode === "list" ? renderListView() : renderGridView()
            )}
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