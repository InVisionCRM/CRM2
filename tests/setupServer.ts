import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { handlers as googleDriveHandlers } from './handlers/googleDrive';

// Define auth handlers
const authHandlers = [
  rest.post('/api/auth/refresh', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Token refreshed' })
    );
  }),
];

// Combine all handlers
export const handlers = [...authHandlers, ...googleDriveHandlers];

// Set up MSW
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close()); 