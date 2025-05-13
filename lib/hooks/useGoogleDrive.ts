import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { GoogleDriveService } from "@/lib/services/googleDrive";
import type { DriveFile, ServiceResult } from "@/types/drive";
import { useState } from "react";

const SWR_KEY_PREFIX = "/api/drive";

interface UseGoogleDriveOptions {
  folderId?: string;
  mimeTypes?: string[];
  fetchOnInit?: boolean;
}

export function useGoogleDrive(options?: UseGoogleDriveOptions) {
  const { data: session } = useSession();
  const { folderId, mimeTypes, fetchOnInit = true } = options || {};
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(folderId);
  const [folderPath, setFolderPath] = useState<DriveFile[]>([]);

  const getService = () => {
    if (!session?.accessToken) {
      throw new Error("No access token available. User might not be authenticated.");
    }
    return new GoogleDriveService({ accessToken: session.accessToken });
  };

  const swrKey = session?.accessToken 
    ? `${SWR_KEY_PREFIX}?folderId=${currentFolderId || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID_DEFAULT || ''}&mimeTypes=${(mimeTypes || []).join(',')}` 
    : null;

  const fetcher = async (): Promise<ServiceResult<DriveFile[]>> => {
    try {
      const service = getService();
      return await service.listFiles({ folderId, mimeTypes });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch files from hook";
      console.error("useGoogleDrive fetcher error:", error);
      return { success: false, message };
    }
  };

  const { data, error, isLoading, isValidating } = useSWR<ServiceResult<DriveFile[]>>(
    fetchOnInit ? swrKey : null, 
    fetcher, 
    {
      revalidateOnFocus: false,
      // Add other SWR options as needed, mirroring useGoogleCalendar
    }
  );

  const revalidateFiles = () => {
    if (swrKey) {
      mutate(swrKey);
    }
  };

  const fetchFiles = async (opts?: { folderId?: string; mimeTypes?: string[] }): Promise<ServiceResult<DriveFile[]>> => {
    try {
      const service = getService();
      const currentFolderId = opts?.folderId || folderId || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID_DEFAULT;
      const currentMimeTypes = opts?.mimeTypes || mimeTypes;
      const result = await service.listFiles({ folderId: currentFolderId, mimeTypes: currentMimeTypes });
      if (result.success && swrKey) {
        // Potentially update SWR cache if the options match the current key
        // For simplicity, we'll just revalidate if it was a general fetch.
        // Or, if specific component needs update, it can call revalidateFiles.
        const currentSWRKey = `${SWR_KEY_PREFIX}?folderId=${currentFolderId || ''}&mimeTypes=${(currentMimeTypes || []).join(',')}`;
        if (currentSWRKey === swrKey || !opts) {
             mutate(swrKey, result, false); // Update local SWR cache without revalidation
        }
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
      const service = getService();
      const result = await service.uploadFile(file, { 
        folderId: opts?.folderId || folderId || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID_DEFAULT 
      });
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
      const service = getService();
      return await service.downloadFile(fileId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to download file";
      console.error("downloadFile error:", e);
      return { success: false, message };
    }
  };

  const deleteFile = async (fileId: string): Promise<ServiceResult<void>> => {
    try {
      const service = getService();
      const result = await service.deleteFile(fileId);
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
      console.log(`[useGoogleDrive] Attempting to delete folder: ${folderId}`);
      const result = await deleteFile(folderId); // Reuses the existing deleteFile logic
      if (result.success) {
        console.log(`[useGoogleDrive] Successfully deleted folder: ${folderId}, revalidating files.`);
      } else {
        console.error(`[useGoogleDrive] Failed to delete folder: ${folderId}`, result.message);
      }
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete folder in hook";
      console.error(`[useGoogleDrive] Error in deleteFolder for ID ${folderId}:`, e);
      return { success: false, message };
    }
  };

  const createFolder = async (name: string, opts?: { parentId?: string }): Promise<ServiceResult<DriveFile>> => {
    try {
      const service = getService();
      const result = await service.createFolder(name, {
        parentId: opts?.parentId || folderId || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID_DEFAULT
      });
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