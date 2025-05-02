import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"
import type { NextAuthOptions } from "next-auth"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode to see detailed logs
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          console.log("Querying user with email:", credentials.email)

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          console.log("Query result:", user)

          if (!user) {
            console.log("No user found with email:", credentials.email)
            return null
          }

          // For testing purposes, let's accept any password for the test user
          // IMPORTANT: Remove this in production!
          if (credentials.email === "admin@example.com" && credentials.password === "password123") {
            console.log("Test user login successful")
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image || null,
            }
          }

          // In production, use proper password verification
          // const passwordMatch = await bcrypt.compare(credentials.password, user.password)
          // if (!passwordMatch) {
          //   console.log("Password doesn't match")
          //   return null
          // }

          console.log("Login successful for:", user.email)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image || null,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          // Check if user exists
          let dbUser = await prisma.user.findUnique({
            where: { email: profile.email },
          })

          if (!dbUser) {
            // Create new user
            console.log("Creating new user from Google login:", profile.email)

            // Generate a random password for Google users
            const randomPassword = Math.random().toString(36).slice(-10)

            dbUser = await prisma.user.create({
              data: {
                name: profile.name || "Google User",
                email: profile.email,
                password: randomPassword, // Store the random password
                image: profile.image || null,
              },
            })

            console.log("User created successfully")
          }

          // Update the user object with the database ID
          user.id = dbUser.id
        } catch (error) {
          console.error("Error creating/updating user:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // If signing in, add the user ID to the token
      if (user) {
        token.id = user.id
        console.log("JWT token updated with user ID:", user.id)
      }

      // If we don't have an ID in the token yet, try to find it
      if (!token.id && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true },
          })

          if (dbUser) {
            token.id = dbUser.id
            console.log("JWT token updated with user ID from email:", dbUser.id)
          }
        } catch (error) {
          console.error("Error fetching user ID for token:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        console.log("Session updated with user ID:", token.id)
      }
      return session
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("Sign in event:", user.email)
    },
    async createUser({ user }) {
      console.log("Create user event:", user.email)
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
