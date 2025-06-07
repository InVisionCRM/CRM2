import { GoogleDriveService } from '../../lib/services/googleDrive';
import { mockFile } from '../../tests/handlers/googleDrive';
import { server } from '../../tests/setupServer';
import { rest } from 'msw';
import fetch from 'node-fetch';
global.fetch = fetch as any;

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3";

describe('GoogleDriveService', () => {
  const service = new GoogleDriveService('fake-access-token');

  describe('listFiles', () => {
    it("should return a list of files", async () => {
      const result = await service.listFiles();
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data?.[0]?.id).toBe(mockFile.id);
    });

    it("should handle API errors gracefully for listFiles", async () => {
      server.use(
        rest.get(`${GOOGLE_DRIVE_API_BASE}/files`, (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: { message: 'Failed to list files' } })
          );
        })
      );
      const result = await service.listFiles();
      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to list files");
    });
  });

  describe('uploadFile', () => {
    it("should upload a file and return its metadata", async () => {
      const dummyFile = new File(["content"], "test.txt", { type: "text/plain" });
      const result = await service.uploadFile(dummyFile);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockFile.id);
      expect(result.data?.name).toBe(mockFile.name);
    });

    it("should handle API errors gracefully for uploadFile", async () => {
      server.use(
        rest.post(`${GOOGLE_DRIVE_UPLOAD_API_BASE}/files`, (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: { message: 'Failed to upload file' } })
          );
        })
      );
      const dummyFile = new File(["content"], "test.txt", { type: "text/plain" });
      const result = await service.uploadFile(dummyFile);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to upload file");
    });
  });

  describe('downloadFile', () => {
    it("should download a file and return its ArrayBuffer content", async () => {
      const result = await service.downloadFile("mockFileId123");
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(result.data?.byteLength).toBe(8);
    });

    it("should handle API errors gracefully for downloadFile", async () => {
      const result = await service.downloadFile("nonExistentId");
      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to download file");
    });
  });

  describe('deleteFile', () => {
    it("should delete a file successfully", async () => {
      const result = await service.deleteFile("mockFileId123");
      expect(result.success).toBe(true);
    });

    it("should handle API errors gracefully for deleteFile", async () => {
      const result = await service.deleteFile("nonExistentId");
      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to delete file");
    });
  });
}); 