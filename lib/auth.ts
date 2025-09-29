// Extend next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string | null;
      image?: string | null;
    };
    // Add accessToken and refreshToken if they are part of the session from Google OAuth
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null; // Ensure role is here if used in JWT/session
    image?: string | null;
  }
}

export { authOptions } from '@/lib/auth/options';

// export const authOptions: NextAuthOptions = { ... }