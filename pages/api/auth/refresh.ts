import { NextApiRequest, NextApiResponse } from 'next';
import { oauth2Client } from '../../../lib/auth/config';
import { serialize } from 'cookie';
import { parse } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const cookies = parse(req.headers.cookie || '');
  const refreshToken = cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).send('Refresh token not found.');
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const { access_token, expiry_date, refresh_token: new_refresh_token } = credentials;

    if (!access_token) {
      throw new Error('Failed to refresh access token');
    }

    const newCookies: string[] = [];
    
    newCookies.push(serialize('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge: expiry_date ? (expiry_date - Date.now()) / 1000 : 3600,
    }));

    if (expiry_date) {
        newCookies.push(serialize('access_token_expiry', expiry_date.toString(), {
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
        }));
    }

    if (new_refresh_token) {
        newCookies.push(serialize('refresh_token', new_refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days
        }));
    }

    res.setHeader('Set-Cookie', newCookies);
    res.status(200).json({ message: 'Token refreshed' });

  } catch (error) {
    console.error('Failed to refresh token', error);
    
    // Clear cookies if refresh fails
    const clearedCookies = [
        serialize('access_token', '', { maxAge: -1, path: '/' }),
        serialize('refresh_token', '', { maxAge: -1, path: '/' }),
        serialize('access_token_expiry', '', { maxAge: -1, path: '/' })
    ];
    res.setHeader('Set-Cookie', clearedCookies);

    res.status(401).json({ message: 'Could not refresh token' });
  }
} 