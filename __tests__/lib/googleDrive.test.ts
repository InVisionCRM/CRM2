import { rest } from "msw";
import { setupServer } from "msw/node";
import { GoogleDriveService, GoogleDriveCredentials } from "@/lib/services/googleDrive";
import type { DriveFile } from "@/types/drive";

const MOCK_ACCESS_TOKEN = "mock_access_token";
const mockCredentials = { accessToken: MOCK_ACCESS_TOKEN };

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3";

const mockFile: DriveFile = {
  id: "mockFileId123",
  name: "Test File.png",
  mimeType: "image/png",
  webViewLink: "https://example.com/view/mockFileId123",
  createdTime: new Date(),
};

const server = setupServer(
  // List files
  rest.get(`${GOOGLE_DRIVE_API_BASE}/files`, (req, res, ctx) => {
    const q = req.url.searchParams.get("q");
    // console.log("MSW listFiles q:", q);
    return res(ctx.status(200), ctx.json({ files: [mockFile] }));
  }),

  // Upload file
  rest.post(`${GOOGLE_DRIVE_UPLOAD_API_BASE}/files`, async (req, res, ctx) => {
    // const formData = await req.formData(); // MSW might need specific handling for FormData
    // const file = formData.get('file');
    // const metadata = JSON.parse(formData.get('metadata') as string);
    // console.log("MSW uploadFile metadata:", metadata, "file:", file);
    return res(ctx.status(200), ctx.json(mockFile));
  }),

  // Download file (ArrayBuffer)
  rest.get(`${GOOGLE_DRIVE_API_BASE}/files/:fileId`, (req, res, ctx) => {
    const { fileId } = req.params;
    if (req.url.searchParams.get("alt") === "media") {
      if (fileId === "mockFileId123") {
        const buffer = new ArrayBuffer(8);
        return res(ctx.status(200), ctx.set('Content-Type', 'application/octet-stream'), ctx.body(buffer));
      }
      return res(ctx.status(404), ctx.json({ error: { message: "File not found" } }));
    }
    // Potentially handle metadata GET if needed for other tests
    return res(ctx.status(404)); 
  }),

  // Delete file
  rest.delete(`${GOOGLE_DRIVE_API_BASE}/files/:fileId`, (req, res, ctx) => {
    const { fileId } = req.params;
    if (fileId === "mockFileId123") {
      return res(ctx.status(204)); // No content
    }
    return res(ctx.status(404), ctx.json({ error: { message: "File not found" } }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("GoogleDriveService", () => {
  let service: GoogleDriveService;

  beforeEach(() => {
    service = new GoogleDriveService(mockCredentials);
    // Mock environment variable for default folder ID if your service uses it
    // process.env.GOOGLE_DRIVE_FOLDER_ID_DEFAULT = "mockDefaultFolderId";
  });

  describe("listFiles", () => {
    it("should return a list of files", async () => {
      const result = await service.listFiles();
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data?.[0]?.id).toBe(mockFile.id);
    });

    it("should handle API errors gracefully for listFiles", async () => {
      server.use(
        rest.get(`${GOOGLE_DRIVE_API_BASE}/files`, (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: { message: "Internal Server Error" } }));
        })
      );
      const result = await service.listFiles();
      expect(result.success).toBe(false);
      expect(result.message).toContain("Internal Server Error");
    });
  });

  describe("uploadFile", () => {
    it("should upload a file and return its metadata", async () => {
      const dummyFile = new File(["content"], "test.txt", { type: "text/plain" });
      const result = await service.uploadFile(dummyFile);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockFile.id);
      expect(result.data?.name).toBe(mockFile.name); // Or reflect dummyFile.name if MSW mock is more dynamic
    });

    it("should handle API errors gracefully for uploadFile", async () => {
      server.use(
        rest.post(`${GOOGLE_DRIVE_UPLOAD_API_BASE}/files`, (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: { message: "Upload Failed" } }));
        })
      );
      const dummyFile = new File(["content"], "test.txt", { type: "text/plain" });
      const result = await service.uploadFile(dummyFile);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Upload Failed");
    });
  });

  describe("downloadFile", () => {
    it("should download a file and return its ArrayBuffer content", async () => {
      const result = await service.downloadFile("mockFileId123");
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(result.data?.byteLength).toBe(8);
    });

    it("should handle API errors gracefully for downloadFile", async () => {
      server.use(
        rest.get(`${GOOGLE_DRIVE_API_BASE}/files/:fileId`, (req, res, ctx) => {
          if (req.url.searchParams.get("alt") === "media") {
            return res(ctx.status(500), ctx.json({ error: { message: "Download Failed" } }));
          }
          return res(ctx.status(404));
        })
      );
      const result = await service.downloadFile("nonExistentId");
      expect(result.success).toBe(false);
      expect(result.message).toContain("Download Failed"); // Or based on your actual error handling
    });
  });

  describe("deleteFile", () => {
    it("should delete a file successfully", async () => {
      const result = await service.deleteFile("mockFileId123");
      expect(result.success).toBe(true);
    });

    it("should handle API errors gracefully for deleteFile", async () => {
      server.use(
        rest.delete(`${GOOGLE_DRIVE_API_BASE}/files/:fileId`, (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: { message: "Deletion Failed" } }));
        })
      );
      const result = await service.deleteFile("mockFileId123");
      expect(result.success).toBe(false);
      expect(result.message).toContain("Deletion Failed");
    });
  });
}); 