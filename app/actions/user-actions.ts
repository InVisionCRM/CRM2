"use server"

import { prisma } from "@/lib/db/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function getAssignableUsersAction() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { success: false, users: [], message: "Unauthorized" };
    }
    // Get users that can be assigned to leads (exclude contractors)
    // Cast role to text to avoid enum issues
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role::text
      FROM "User"
      WHERE role::text != 'CONTRACTOR'
      ORDER BY name ASC
    ` as Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;


    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error("Error fetching assignable users:", error);
    return {
      success: false,
      users: [],
      message: error instanceof Error ? error.message : "Failed to fetch users"
    };
  }
}