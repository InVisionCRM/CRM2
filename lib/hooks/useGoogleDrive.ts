import useSWR, { mutate } from "swr";
import { useSession } from "next-auth/react";
import { GoogleDriveService } from "@/lib/services/googleDrive";
import type { DriveFile, ServiceResult } from "@/types/drive";

const SWR_KEY_PREFIX = "/api/drive";

interface UseGoogleDriveOptions {
  folderId?: string;
  mimeTypes?: string[];
  fetchOnInit?: boolean;
}

export function useGoogleDrive(options?: UseGoogleDriveOptions) {
  const { data: session } = useSession();
  const { folderId, mimeTypes, fetchOnInit = true } = options || {};

  const getService = () => {
    if (!session?.accessToken) {
      throw new Error("No access token available. User might not be authenticated.");
    }
    return new GoogleDriveService({ accessToken: session.accessToken });
  };

  const swrKey = session?.accessToken 
    ? `${SWR_KEY_PREFIX}?folderId=${folderId || process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID_DEFAULT || ''}&mimeTypes=${(mimeTypes || []).join(',')}` 
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

  return {
    files: data?.data,
    isLoading: isLoading && fetchOnInit, // Only loading if fetchOnInit was true
    isError: !!error || (data && !data.success),
    error: error || (data?.message ? new Error(data.message) : null),
    isValidating,
    fetchFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    revalidateFiles,
  };
} 