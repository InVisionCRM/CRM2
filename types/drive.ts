export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: Date;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
} 