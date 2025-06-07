import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { parse } from 'cookie';
import { oauth2Client } from '../../../lib/auth/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const cookies = parse(req.headers.cookie || '');
  const refreshToken = cookies.refresh_token;

  const clearCookies = (res: NextApiResponse) => {
    const clearedCookies = [
      serialize('access_token', '', { maxAge: -1, path: '/' }),
      serialize('refresh_token', '', { maxAge: -1, path: '/' }),
      serialize('access_token_expiry', '', { maxAge: -1, path: '/' }),
    ];
    res.setHeader('Set-Cookie', clearedCookies);
  };
  
  if (refreshToken) {
    try {
      await oauth2Client.revokeToken(refreshToken);
    } catch (error) {
      console.error('Failed to revoke token, clearing cookies anyway', error);
    }
  }

  clearCookies(res);
  res.status(200).json({ message: 'Logged out' });
} 