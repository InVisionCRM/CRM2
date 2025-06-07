import { NextApiRequest, NextApiResponse } from 'next';
import { oauth2Client } from '../../../lib/auth/config';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;

  if (typeof code !== 'string') {
    return res.status(400).send('Invalid code');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token) {
      return res.status(400).send('Failed to retrieve access token');
    }

    const cookies: string[] = [];

    // Set access token cookie
    cookies.push(serialize('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge: expiry_date ? (expiry_date - Date.now()) / 1000 : 3600,
    }));

    if (expiry_date) {
        cookies.push(serialize('access_token_expiry', expiry_date.toString(), {
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days, same as refresh token
        }));
    }

    // Set refresh token cookie if it exists
    if (refresh_token) {
      cookies.push(serialize('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      }));
    }
    
    res.setHeader('Set-Cookie', cookies);

    // Redirect to a logged-in page
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Failed to exchange token', error);
    res.status(500).send('Failed to exchange token');
  }
} 