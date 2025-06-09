import { AuthOptions } from "next-auth"
import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"
// import { GOOGLE_CALENDAR_CONFIG } from "@/lib/config/google-calendar"
import { GOOGLE_SCOPES } from "@/lib/constants"

// Define all required Google Calendar scopes
const GOOGLE_SCOPES_JOINED = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.settings.readonly",
  "https://www.googleapis.com/auth/drive",           // Full Drive access (read/write)
  "https://www.googleapis.com/auth/drive.file",      // Access to files created/opened by app
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly"
].join(" ")

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES.join(" "),
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // token.expiresAt = account.expires_at; // If Google provides it and you need it
        token.id = user?.id; // Make sure user.id is available from adapter/profile

        // Fetch user role from database
        if (user?.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
          });
          if (dbUser) {
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.role) {
        session.user.role = token.role as string;
      }
      // session.user.role = token.role as string; // if you add role to token
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    // error: '/auth/error', // Optional: specify a custom error page
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        domain: process.env.NODE_ENV === 'production' ? '.purlin.pro' : undefined, // This allows sharing across subdomains
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
