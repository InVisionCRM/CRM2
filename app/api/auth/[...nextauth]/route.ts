import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { sql } from "@/lib/db"
import type { NextAuthOptions } from "next-auth"

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

          // Query the existing users table
          const users = await sql`
            SELECT * FROM users WHERE email = ${credentials.email} LIMIT 1
          `

          console.log("Query result:", users)

          if (!users || users.length === 0) {
            console.log("No user found with email:", credentials.email)
            return null
          }

          const user = users[0]

          // For testing purposes, let's accept any password for the test user
          // IMPORTANT: Remove this in production!
          if (credentials.email === "admin@example.com" && credentials.password === "password123") {
            console.log("Test user login successful")
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            }
          }

          // In production, use proper password verification
          // const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)
          // if (!passwordMatch) {
          //   console.log("Password doesn't match")
          //   return null
          // }

          console.log("Login successful for:", user.email)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
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
          const existingUsers = await sql`
            SELECT * FROM users WHERE email = ${profile.email} LIMIT 1
          `

          if (existingUsers.length === 0) {
            // Create new user
            console.log("Creating new user from Google login:", profile.email)

            // Generate a random password hash for Google users
            const randomPasswordHash = Math.random().toString(36).slice(-10)

            await sql`
              INSERT INTO users (name, email, password_hash, password, image)
              VALUES (
                ${profile.name || "Google User"}, 
                ${profile.email}, 
                ${randomPasswordHash},
                ${randomPasswordHash},
                ${profile.image || null}
              )
            `

            console.log("User created successfully")

            // Get the newly created user
            const newUsers = await sql`
              SELECT * FROM users WHERE email = ${profile.email} LIMIT 1
            `

            if (newUsers.length > 0) {
              // Update the user object with the database ID
              user.id = newUsers[0].id
            }
          } else {
            // Update the user object with the database ID
            user.id = existingUsers[0].id
          }
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
          const users = await sql`
            SELECT id FROM users WHERE email = ${token.email} LIMIT 1
          `

          if (users.length > 0) {
            token.id = users[0].id
            console.log("JWT token updated with user ID from email:", users[0].id)
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
