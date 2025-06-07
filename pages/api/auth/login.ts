import { NextApiRequest, NextApiResponse } from 'next';
import { oauth2Client } from '../../../lib/auth/config';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  res.redirect(url);
} 