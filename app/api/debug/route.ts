import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    console.log('=== DEBUG ENDPOINT ===');
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log('User count in database:', userCount);
    
    // Get session
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    // Try to get users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 5
    });
    
    return NextResponse.json({
      success: true,
      userCount,
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      sampleUsers: users,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 