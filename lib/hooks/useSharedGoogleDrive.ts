import useSWR, { mutate } from "swr";
import type { DriveFile, ServiceResult } from "@/types/drive";
import { useState } from "react";

const SWR_KEY_PREFIX = "/api/files/list-drive-folder";

interface UseSharedGoogleDriveOptions {
  folderId?: string;
  mimeTypes?: string[];
  fetchOnInit?: boolean;
}

export function useSharedGoogleDrive(options?: UseSharedGoogleDriveOptions) {
  const { folderId, mimeTypes, fetchOnInit = true } = options || {};
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(folderId);
  const [folderPath, setFolderPath] = useState<DriveFile[]>([]);

  const swrKey = `${SWR_KEY_PREFIX}?folderId=${currentFolderId || '0ALLiVXNBCH8OUk9PVA'}&mimeTypes=${(mimeTypes || []).join(',')}`;

  const fetcher = async (): Promise<ServiceResult<DriveFile[]>> => {
    try {
      const params = new URLSearchParams();
      const targetFolderId = currentFolderId || '0ALLiVXNBCH8OUk9PVA';
      params.append('folderId', targetFolderId);
      
      if (mimeTypes && mimeTypes.length > 0) {
        params.append('mimeTypes', mimeTypes.join(','));
      }

      const response = await fetch(`/api/files/list-drive-folder?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ServiceResult<DriveFile[]> = await response.json();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch files from shared drive";
      console.error("useSharedGoogleDrive fetcher error:", error);
      return { success: false, message };
    }
  };

  const { data, error, isLoading, isValidating } = useSWR<ServiceResult<DriveFile[]>>(
    fetchOnInit ? swrKey : null, 
    fetcher, 
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
      errorRetryCount: 3,
    }
  );

  const revalidateFiles = () => {
    if (swrKey) {
      mutate(swrKey);
    }
  };

  const fetchFiles = async (opts?: { folderId?: string; mimeTypes?: string[] }): Promise<ServiceResult<DriveFile[]>> => {
    try {
      const params = new URLSearchParams();
      const targetFolderId = opts?.folderId || currentFolderId || '0ALLiVXNBCH8OUk9PVA';
      const targetMimeTypes = opts?.mimeTypes || mimeTypes;
      
      params.append('folderId', targetFolderId);
      if (targetMimeTypes && targetMimeTypes.length > 0) {
        params.append('mimeTypes', targetMimeTypes.join(','));
      }

      const response = await fetch(`/api/files/list-drive-folder?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ServiceResult<DriveFile[]> = await response.json();
      
      // Update SWR cache if this matches current key
      const currentSWRKey = `${SWR_KEY_PREFIX}?folderId=${targetFolderId || ''}&mimeTypes=${(targetMimeTypes || []).join(',')}`;
      if (currentSWRKey === swrKey || !opts) {
        mutate(swrKey, result, false);
      }
      
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch files";
      console.error("fetchFiles error:", e);
      return { success: false, message };
    }
  };

  const uploadFile = async (file: File, opts?: { folderId?: string }): Promise<ServiceResult<DriveFile>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (opts?.folderId) {
        formData.append('folderId', opts.folderId);
      } else if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      const response = await fetch('/api/files/upload-to-drive-folder', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ServiceResult<DriveFile> = await response.json();
      if (result.success) {
        revalidateFiles(); // Revalidate the list of files after successful upload
      }
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to upload file";
      console.error("uploadFile error:", e);
      return { success: false, message };
    }
  };

  const downloadFile = async (fileId: string): Promise<ServiceResult<ArrayBuffer>> => {
    try {
      const response = await fetch(`https://drive.google.com/file/d/${fileId}/view`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return { success: true, data: arrayBuffer };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to download file";
      console.error("downloadFile error:", e);
      return { success: false, message };
    }
  };

  const deleteFile = async (fileId: string): Promise<ServiceResult<void>> => {
    try {
      const response = await fetch(`/api/files/delete-drive-file?fileId=${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ServiceResult<void> = await response.json();
      if (result.success) {
        revalidateFiles(); // Revalidate the list of files after successful deletion
      }
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete file";
      console.error("deleteFile error:", e);
      return { success: false, message };
    }
  };

  const deleteFolder = async (folderId: string): Promise<ServiceResult<void>> => {
    // Deleting a folder is the same as deleting a file in Google Drive API
    // This function provides a semantic wrapper.
    try {
      console.log(`[useSharedGoogleDrive] Attempting to delete folder: ${folderId}`);
      const result = await deleteFile(folderId); // Reuses the existing deleteFile logic
      if (result.success) {
        console.log(`[useSharedGoogleDrive] Successfully deleted folder: ${folderId}, revalidating files.`);
      } else {
        console.error(`[useSharedGoogleDrive] Failed to delete folder: ${folderId}`, result.message);
      }
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete folder in hook";
      console.error(`[useSharedGoogleDrive] Error in deleteFolder for ID ${folderId}:`, e);
      return { success: false, message };
    }
  };

  const createFolder = async (name: string, opts?: { parentId?: string }): Promise<ServiceResult<DriveFile>> => {
    try {
      const response = await fetch('/api/files/create-drive-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parentId: opts?.parentId || currentFolderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ServiceResult<DriveFile> = await response.json();
      if (result.success) {
        revalidateFiles(); // Revalidate the list of files after successful folder creation
      }
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create folder";
      console.error("createFolder error:", e);
      return { success: false, message };
    }
  };

  const navigateToFolder = async (folder: DriveFile) => {
    try {
      setCurrentFolderId(folder.id);
      // Add the folder to the path
      setFolderPath(prev => [...prev, folder]);
      // Fetch files in the new folder
      await fetchFiles({ folderId: folder.id, mimeTypes });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to navigate to folder";
      console.error("navigateToFolder error:", e);
      return { success: false, message };
    }
  };

  const navigateBack = async () => {
    try {
      // Remove the last folder from the path
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      
      // Set the current folder ID to the last folder in the path, or undefined if we're at root
      const newFolderId = newPath.length > 0 ? newPath[newPath.length - 1].id : undefined;
      setCurrentFolderId(newFolderId);
      
      // Fetch files in the parent folder
      await fetchFiles({ folderId: newFolderId, mimeTypes });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to navigate back";
      console.error("navigateBack error:", e);
      return { success: false, message };
    }
  };

  return {
    files: data?.data,
    isLoading: isLoading && fetchOnInit,
    isError: !!error || (data && !data.success),
    error: error || (data?.message ? new Error(data.message) : null),
    isValidating,
    fetchFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    createFolder,
    revalidateFiles,
    currentFolderId,
    folderPath,
    navigateToFolder,
    navigateBack,
    deleteFolder,
  };
}