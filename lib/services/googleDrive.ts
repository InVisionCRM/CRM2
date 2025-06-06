import type { DriveFile, ServiceResult } from "@/types/drive";

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3";

export interface GoogleDriveCredentials {
  accessToken: string;
  refreshToken?: string | null;
}

// Extended DriveFile interface to support additional fields from Google Drive API
export interface ExtendedDriveFile extends DriveFile {
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
  [key: string]: any; // To support any additional fields returned from Drive API
}

export class GoogleDriveService {
  private credentials: GoogleDriveCredentials;

  constructor(credentials: GoogleDriveCredentials) {
    this.credentials = credentials;
  }

  private async fetchGoogleAPI<T>(
    endpoint: string,
    options: RequestInit = {},
    isUpload = false
  ): Promise<T> {
    const baseUrl = isUpload ? GOOGLE_DRIVE_UPLOAD_API_BASE : GOOGLE_DRIVE_API_BASE;
    const response = await fetch(`${baseUrl}${endpoint}`,
      {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use status text
        errorData = { error: { message: response.statusText } };
      }
      const errorMessage = errorData?.error?.message || `Google Drive API request failed with status ${response.status}`;
      console.error("Google Drive API Error:", errorMessage, "Details:", errorData);
      throw new Error(errorMessage);
    }
    // For 204 No Content (e.g., deleteFile)
    if (response.status === 204) {
      return {} as T; // Or null, depending on how you want to handle it
    }
    return response.json() as Promise<T>;
  }

  async listFiles(opts?: { 
    mimeTypes?: string[]; 
    folderId?: string;
    customQuery?: string;
    customFields?: string; 
  }): Promise<ServiceResult<DriveFile[]>> {
    try {
      const params = new URLSearchParams();
      params.append("fields", opts?.customFields || "files(id, name, mimeType, webViewLink, createdTime)");
      
      let q = "";
      
      if (opts?.customQuery) {
        // Use the provided custom query string directly
        q = opts.customQuery;
      } else {
        // Build the query as before
        q = "trashed=false";

        if (opts?.folderId) {
          q += ` and '${opts.folderId}' in parents`;
        } else if (process.env.GOOGLE_DRIVE_FOLDER_ID_DEFAULT) {
          q += ` and '${process.env.GOOGLE_DRIVE_FOLDER_ID_DEFAULT}' in parents`;
        }

        if (opts?.mimeTypes && opts.mimeTypes.length > 0) {
          q += ` and (${opts.mimeTypes.map(mt => `mimeType='${mt}'`).join(" or ")})`;
        }
      }
      
      params.append("q", q);
      
      // Log the full request URL for debugging
      const requestUrl = `/files?${params.toString()}`;
      console.log(`Drive API Request: ${GOOGLE_DRIVE_API_BASE}${requestUrl}`);

      const data = await this.fetchGoogleAPI<{ files: DriveFile[] }>(
        requestUrl
      );
      
      console.log(`Drive API Response received with ${data.files?.length || 0} files`);
      
      return { success: true, data: data.files || [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list files";
      console.error("listFiles error:", error);
      return { success: false, message };
    }
  }
  
  /**
   * Lists files in a specific folder with customizable field selection
   * @param folderId - The ID of the Google Drive folder
   * @param options - Options for the request
   */
  async listFilesInFolder(
    folderId: string, 
    options?: { 
      mimeTypes?: string[]; 
      fields?: string;
      pageSize?: number;
      orderBy?: string;
    }
  ): Promise<ServiceResult<ExtendedDriveFile[]>> {
    try {
      // Skip the folder verification as it's causing API errors
      // Just proceed directly to listing files in the folder
      console.log(`listFilesInFolder: Getting files from folder ${folderId}`);
      
      const params = new URLSearchParams();
      
      // Correct format for fields parameter - it needs to be nested properly
      params.append(
        "fields", 
        options?.fields || "files(id,name,mimeType,webViewLink,thumbnailLink,iconLink,modifiedTime,size)"
      );
      
      // Make sure query is formatted correctly
      let q = `'${folderId}' in parents and trashed=false`;
      
      // Add mimeTypes if specified
      if (options?.mimeTypes && options.mimeTypes.length > 0) {
        q += ` and (${options.mimeTypes.map(mt => `mimeType='${mt}'`).join(" or ")})`;
      }
      
      params.append("q", q);
      
      // Add pagination if specified
      if (options?.pageSize) {
        params.append("pageSize", options.pageSize.toString());
      } else {
        // Default to a reasonable page size
        params.append("pageSize", "100");
      }
      
      // Add sorting if specified
      if (options?.orderBy) {
        params.append("orderBy", options.orderBy);
      } else {
        // Default to sorting by most recent first
        params.append("orderBy", "modifiedTime desc");
      }
      
      // Log the full request URL for debugging
      const requestUrl = `/files?${params.toString()}`;
      console.log(`listFilesInFolder: Drive API Request: ${GOOGLE_DRIVE_API_BASE}${requestUrl}`);
      
      const data = await this.fetchGoogleAPI<{ files: ExtendedDriveFile[] }>(requestUrl);
      
      const fileCount = data.files?.length || 0;
      console.log(`listFilesInFolder: Drive API Response received with ${fileCount} files`);
      
      if (fileCount === 0) {
        console.log(`listFilesInFolder: No files found in folder ${folderId}`);
      } else {
        // Log the first few file names for debugging
        const fileNames = data.files.slice(0, 3).map(f => f.name).join(", ");
        console.log(`listFilesInFolder: First few files: ${fileNames}${data.files.length > 3 ? '...' : ''}`);
      }
      
      return { success: true, data: data.files || [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list files in folder";
      console.error("listFilesInFolder error:", error);
      return { success: false, message };
    }
  }

  async uploadFile(file: File, opts?: { folderId?: string }): Promise<ServiceResult<DriveFile>> {
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type,
        ...(opts?.folderId && { parents: [opts.folderId] }),
        ...( !opts?.folderId && process.env.GOOGLE_DRIVE_FOLDER_ID_DEFAULT && { parents: [process.env.GOOGLE_DRIVE_FOLDER_ID_DEFAULT] })
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      formData.append("file", file);

      const data = await this.fetchGoogleAPI<DriveFile>(
        `/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime`,
        {
          method: "POST",
          body: formData,
          // Note: Do not set Content-Type header here for FormData,
          // the browser will set it with the correct boundary.
        },
        true // isUpload = true
      );
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file";
      console.error("uploadFile error:", error);
      return { success: false, message };
    }
  }

  async downloadFile(fileId: string): Promise<ServiceResult<ArrayBuffer>> {
    try {
      const response = await fetch(
        `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText }}));
        const errorMessage = errorData?.error?.message || `Failed to download file with status ${response.status}`;
        console.error("downloadFile error:", errorMessage, "Details:", errorData);
        throw new Error(errorMessage);
      }

      const data = await response.arrayBuffer();
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download file";
      console.error("downloadFile error:", error);
      return { success: false, message };
    }
  }

  async deleteFile(fileId: string): Promise<ServiceResult<void>> {
    try {
      await this.fetchGoogleAPI<void>(`/files/${fileId}`, { method: "DELETE" });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete file";
      console.error("deleteFile error:", error);
      return { success: false, message };
    }
  }

  async createFolder(name: string, opts?: { parentId?: string }): Promise<ServiceResult<DriveFile>> {
    try {
      const metadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(opts?.parentId && { parents: [opts.parentId] }),
        ...(!opts?.parentId && process.env.GOOGLE_DRIVE_FOLDER_ID_DEFAULT && { 
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID_DEFAULT] 
        })
      };

      const data = await this.fetchGoogleAPI<DriveFile>(
        `/files?fields=id,name,mimeType,webViewLink,createdTime`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
        }
      );
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create folder";
      console.error("createFolder error:", error);
      return { success: false, message };
    }
  }
} 