import { renderHook, act } from '@testing-library/react';
import useAuth from '@/hooks/useAuth';
import Cookies from 'js-cookie';
import { rest } from 'msw';
import { server } from '@/tests/setupServer';

describe('useAuth', () => {
  it('should attempt to refresh token if expired and set isAuthenticated to true', async () => {
    // Set expired token cookie
    const expiryTime = (Date.now() - 1000).toString(); // Expired 1 second ago
    Cookies.set('access_token', 'fake-expired-token');
    Cookies.set('access_token_expiry', expiryTime);

    const { result } = renderHook(() => useAuth());

    // Wait for the auth check and refresh to complete
    await act(async () => {
      // Allow promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should set isAuthenticated to false if refresh fails', async () => {
    server.use(
      rest.post('/api/auth/refresh', (req, res, ctx) => {
        return res(ctx.status(401));
      })
    );

    const expiryTime = (Date.now() - 1000).toString();
    Cookies.set('access_token', 'fake-expired-token');
    Cookies.set('access_token_expiry', expiryTime);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
}); 