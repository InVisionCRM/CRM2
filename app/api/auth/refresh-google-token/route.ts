import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.refreshToken) {
      return NextResponse.json(
        { message: "Authentication required or refresh token missing." },
        { status: 401 }
      );
    }

    const { refreshToken } = session;

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("Google token refresh error:", refreshedTokens);
      return NextResponse.json(
        { message: refreshedTokens.error_description || "Failed to refresh Google token." },
        { status: response.status }
      );
    }
    
    // The GoogleCalendarService will use this new accessToken.
    // Persisting it back into the main NextAuth session for future getServerSession calls
    // is more complex and typically handled within the NextAuth jwt/session callbacks.
    console.log("Successfully refreshed Google token. New access_token:", refreshedTokens.access_token);

    return NextResponse.json({
      accessToken: refreshedTokens.access_token,
      // If Google returns a new refresh_token, you might want to handle it too:
      // refreshToken: refreshedTokens.refresh_token,
    });

  } catch (error) {
    console.error("API refresh-google-token error:", error);
    return NextResponse.json(
      { message: "Internal server error while refreshing token." },
      { status: 500 }
    );
  }
} 