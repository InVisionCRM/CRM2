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

    // Get users that can be assigned to leads
    // You can customize this query based on your requirements
    // For example, you might only want to fetch users with specific roles
    const users = await prisma.user.findMany({
      where: {
        // Optional: Filter by roles if needed
        // role: {
        //   in: [UserRole.ADMIN, UserRole.SALES]
        // }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

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