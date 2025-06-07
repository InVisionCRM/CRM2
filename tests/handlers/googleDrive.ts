import { rest } from 'msw';

export const mockFile = {
  id: 'mockFileId123',
  name: 'test.txt',
  mimeType: 'text/plain',
  webViewLink: 'https://drive.google.com/file/d/mockFileId123/view',
  createdTime: new Date().toISOString(),
};

export const handlers = [
  // List files
  rest.get('https://www.googleapis.com/drive/v3/files', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        files: [mockFile],
      })
    );
  }),

  // Upload file
  rest.post('https://www.googleapis.com/upload/drive/v3/files', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockFile)
    );
  }),

  // Download file
  rest.get('https://www.googleapis.com/drive/v3/files/:fileId', (req, res, ctx) => {
    const { fileId } = req.params;
    if (fileId === 'mockFileId123' && req.url.searchParams.get('alt') === 'media') {
      return res(
        ctx.status(200),
        ctx.body(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer)
      );
    }
    return res(
      ctx.status(404),
      ctx.json({ error: { message: 'Failed to download file' } })
    );
  }),

  // Delete file
  rest.delete('https://www.googleapis.com/drive/v3/files/:fileId', (req, res, ctx) => {
    const { fileId } = req.params;
    if (fileId === 'mockFileId123') {
      return res(ctx.status(204));
    }
    return res(
      ctx.status(404),
      ctx.json({ error: { message: 'Failed to delete file' } })
    );
  }),
]; 